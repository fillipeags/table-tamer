import React, { useEffect, useState } from 'react';
import { create } from 'zustand';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (message, type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 3000);
  },
  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

function ToastItemComponent({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 200);
    }, 2800);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const iconColor =
    toast.type === 'success'
      ? '#10b981'
      : toast.type === 'error'
        ? 'var(--color-danger)'
        : 'var(--color-accent)';

  return (
    <div
      style={{
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${iconColor}`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        color: 'var(--color-text-primary)',
        animation: exiting ? 'toastSlideOut 0.2s ease-in forwards' : 'toastSlideIn 0.2s ease-out',
        pointerEvents: 'auto',
      }}
      className="rounded-lg px-3 py-2.5 flex items-center gap-2.5 max-w-xs"
    >
      {toast.type === 'success' && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
          <circle cx="7" cy="7" r="6" stroke={iconColor} strokeWidth="1.2" />
          <path d="M4.5 7L6.5 9L9.5 5" stroke={iconColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {toast.type === 'error' && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
          <circle cx="7" cy="7" r="6" stroke={iconColor} strokeWidth="1.2" />
          <path d="M5 5L9 9M9 5L5 9" stroke={iconColor} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )}
      {toast.type === 'info' && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
          <circle cx="7" cy="7" r="6" stroke={iconColor} strokeWidth="1.2" />
          <path d="M7 6V10" stroke={iconColor} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="7" cy="4.5" r="0.5" fill={iconColor} />
        </svg>
      )}
      <span className="text-xs leading-snug">{toast.message}</span>
      <button
        onClick={() => {
          setExiting(true);
          setTimeout(onDismiss, 200);
        }}
        className="shrink-0 ml-1 rounded p-0.5 hover-text-primary"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      style={{ minWidth: '240px' }}
    >
      {toasts.map((toast) => (
        <ToastItemComponent key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}
