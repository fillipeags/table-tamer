import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { EditorView, keymap, placeholder as cmPlaceholder } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup } from 'codemirror';

export interface SqlEditorHandle {
  setValue: (value: string) => void;
  getValue: () => string;
}

interface SqlEditorProps {
  schema?: Record<string, string[]>;
  onExecute?: () => void;
  initialValue?: string;
  onChange?: (value: string) => void;
}

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '12px',
    background: 'var(--color-surface-1)',
  },
  '.cm-scroller': {
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    lineHeight: '1.7',
    overflow: 'auto',
  },
  '.cm-content': {
    padding: '12px 16px',
    caretColor: 'var(--color-accent)',
  },
  '.cm-gutters': {
    background: 'var(--color-surface-1)',
    borderRight: '1px solid var(--color-border)',
    color: 'var(--color-text-muted)',
  },
  '.cm-activeLineGutter': {
    background: 'var(--color-surface-2)',
  },
  '.cm-activeLine': {
    background: 'rgba(255, 255, 255, 0.03)',
  },
  '.cm-selectionBackground, ::selection': {
    background: 'rgba(0, 93, 255, 0.2) !important',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--color-accent)',
  },
  '&.cm-focused .cm-selectionBackground': {
    background: 'rgba(0, 93, 255, 0.25) !important',
  },
  '.cm-tooltip': {
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  '.cm-tooltip-autocomplete': {
    '& > ul': {
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      fontSize: '11px',
    },
    '& > ul > li': {
      padding: '2px 8px',
    },
    '& > ul > li[aria-selected]': {
      background: 'rgba(0, 93, 255, 0.2)',
      color: 'var(--color-text-primary)',
    },
  },
  '.cm-completionLabel': {
    color: 'var(--color-text-primary)',
  },
  '.cm-completionDetail': {
    color: 'var(--color-text-muted)',
    fontStyle: 'italic',
  },
});

export const SqlEditor = forwardRef<SqlEditorHandle, SqlEditorProps>(
  ({ schema, onExecute, initialValue = '', onChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const sqlCompartment = useRef(new Compartment());
    const onExecuteRef = useRef(onExecute);
    const onChangeRef = useRef(onChange);

    // Keep callback refs current without recreating editor
    useEffect(() => {
      onExecuteRef.current = onExecute;
    }, [onExecute]);

    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    useImperativeHandle(ref, () => ({
      setValue: (value: string) => {
        const view = viewRef.current;
        if (view) {
          view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: value },
          });
        }
      },
      getValue: () => {
        return viewRef.current?.state.doc.toString() ?? '';
      },
    }));

    // Create editor on mount
    useEffect(() => {
      if (!containerRef.current) return;

      const executeKeymap = keymap.of([
        {
          key: 'Mod-Enter',
          run: () => {
            onExecuteRef.current?.();
            return true;
          },
        },
      ]);

      const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current?.(update.state.doc.toString());
        }
      });

      const sqlExtension = sql({
        schema: schema,
        upperCaseKeywords: true,
      });

      const state = EditorState.create({
        doc: initialValue,
        extensions: [
          executeKeymap,
          basicSetup,
          sqlCompartment.current.of(sqlExtension),
          oneDark,
          editorTheme,
          updateListener,
          cmPlaceholder('-- Write your SQL query here\nSELECT * FROM table_name LIMIT 100;'),
          EditorView.lineWrapping,
        ],
      });

      const view = new EditorView({
        state,
        parent: containerRef.current,
      });

      viewRef.current = view;

      return () => {
        view.destroy();
        viewRef.current = null;
      };
    }, []);

    // Update schema when it changes via compartment reconfiguration
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;

      const sqlExtension = sql({
        schema: schema,
        upperCaseKeywords: true,
      });

      view.dispatch({
        effects: sqlCompartment.current.reconfigure(sqlExtension),
      });
    }, [schema]);

    // Handle initialValue changes from outside (e.g., loading a saved query)
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;

      const currentDoc = view.state.doc.toString();
      if (initialValue !== currentDoc && initialValue !== undefined) {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: initialValue },
        });
      }
    }, [initialValue]);

    return (
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{
          background: 'var(--color-surface-1)',
        }}
      />
    );
  }
);

SqlEditor.displayName = 'SqlEditor';
