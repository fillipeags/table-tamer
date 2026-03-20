import React, { useMemo } from 'react';
import {
  ReactFlow,
  type Node,
  type Edge,
  Background,
  Controls,
  MiniMap,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAppStore } from '../stores/appStore';

export function SchemaGraph() {
  const tables = useAppStore((s) => s.tables);
  const allSchemas = useAppStore((s) => s.allSchemas);

  const { initialNodes, initialEdges } = useMemo(() => {
    const tableNames = new Set(tables.map(t => t.name));

    // Infer relationships
    const relationships: { source: string; target: string; column: string }[] = [];
    for (const [tableName, columns] of Object.entries(allSchemas)) {
      for (const col of columns) {
        if (col.name.endsWith('_id') && col.name !== 'uuid_id' && col.name !== 'id') {
          const refName = col.name.replace(/_id$/, '');
          if (tableNames.has(refName)) {
            relationships.push({ source: tableName, target: refName, column: col.name });
          }
        }
      }
    }

    // Build adjacency for layout
    const neighbors = new Map<string, Set<string>>();
    for (const t of tables) neighbors.set(t.name, new Set());
    for (const r of relationships) {
      neighbors.get(r.source)?.add(r.target);
      neighbors.get(r.target)?.add(r.source);
    }

    // Count connections
    const connectionCount = new Map<string, number>();
    for (const t of tables) connectionCount.set(t.name, neighbors.get(t.name)?.size || 0);

    const sorted = [...tables].sort((a, b) => (connectionCount.get(b.name) || 0) - (connectionCount.get(a.name) || 0));

    const placed = new Map<string, { x: number; y: number }>();
    const nodeW = 200;
    const nodeH = 48;
    const gapX = 140;
    const gapY = 100;

    // Find connected components and process each one
    const components: string[][] = [];
    const componentVisited = new Set<string>();

    for (const t of sorted) {
      if (componentVisited.has(t.name)) continue;
      const component: string[] = [];
      const bfsQueue = [t.name];
      componentVisited.add(t.name);
      while (bfsQueue.length > 0) {
        const current = bfsQueue.shift()!;
        component.push(current);
        const nbrs = neighbors.get(current) || new Set();
        for (const nbr of nbrs) {
          if (!componentVisited.has(nbr)) {
            componentVisited.add(nbr);
            bfsQueue.push(nbr);
          }
        }
      }
      components.push(component);
    }

    // Separate connected components (have edges) from isolated nodes
    const connectedComponents = components.filter(c => c.length > 1 || (connectionCount.get(c[0]) || 0) > 0);
    const isolatedNodes = components.filter(c => c.length === 1 && (connectionCount.get(c[0]) || 0) === 0).map(c => c[0]);

    // Layout connected components using BFS with wider spacing
    let componentStartY = 0;

    for (const component of connectedComponents) {
      // Sort by connection count within component
      const compSorted = component.sort((a, b) => (connectionCount.get(b) || 0) - (connectionCount.get(a) || 0));
      const root = compSorted[0];

      // BFS layout for this component
      const localVisited = new Set<string>();
      const localQueue: { name: string; depth: number; parentY: number }[] = [{ name: root, depth: 0, parentY: componentStartY }];
      localVisited.add(root);

      // Track used positions per depth column to avoid overlaps
      const depthYPositions = new Map<number, number>();

      while (localQueue.length > 0) {
        const { name, depth, parentY } = localQueue.shift()!;
        const x = depth * (nodeW + gapX);

        // Get the next available Y for this depth column
        const minY = depthYPositions.get(depth) ?? componentStartY;
        const y = Math.max(minY, parentY);

        placed.set(name, { x, y });
        depthYPositions.set(depth, y + nodeH + gapY);

        // Queue neighbors
        const nbrs = Array.from(neighbors.get(name) || []).filter(n => !localVisited.has(n));
        let childY = y;
        for (const nbr of nbrs) {
          localVisited.add(nbr);
          localQueue.push({ name: nbr, depth: depth + 1, parentY: childY });
          childY += nodeH + gapY;
        }
      }

      // Calculate component bottom
      const compNodes = component.filter(n => placed.has(n));
      const maxY = Math.max(...compNodes.map(n => placed.get(n)!.y));
      componentStartY = maxY + nodeH + gapY * 2;
    }

    // Place isolated nodes in a grid below connected components
    if (isolatedNodes.length > 0) {
      const gridStartY = componentStartY + gapY;
      const maxCols = Math.max(4, Math.ceil(Math.sqrt(isolatedNodes.length)));
      let col = 0;
      let row = 0;

      for (const name of isolatedNodes) {
        placed.set(name, {
          x: col * (nodeW + gapX),
          y: gridStartY + row * (nodeH + gapY),
        });
        col++;
        if (col >= maxCols) {
          col = 0;
          row++;
        }
      }
    }

    const initialNodes: Node[] = tables.map((table) => {
      const pos = placed.get(table.name) || { x: 0, y: 0 };
      const conns = connectionCount.get(table.name) || 0;
      return {
        id: table.name,
        position: pos,
        data: { label: table.name },
        style: {
          background: conns > 3 ? 'rgba(0,93,255,0.12)' : conns > 0 ? 'var(--color-surface-2)' : 'var(--color-surface-3)',
          border: `1px solid ${conns > 3 ? 'var(--color-accent)' : 'var(--color-border)'}`,
          borderRadius: '6px',
          color: 'var(--color-text-primary)',
          fontSize: '10px',
          fontFamily: 'monospace',
          padding: '8px 12px',
          width: nodeW,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    });

    const initialEdges: Edge[] = relationships.map((r) => ({
      id: `${r.source}-${r.target}-${r.column}`,
      source: r.source,
      target: r.target,
      label: r.column,
      labelStyle: { fontSize: '8px', fill: 'var(--color-text-muted)' },
      labelBgStyle: { fill: 'var(--color-surface-0)', fillOpacity: 0.9 },
      labelBgPadding: [4, 2] as [number, number],
      style: { stroke: 'var(--color-accent)', strokeWidth: 1, strokeOpacity: 0.5 },
      markerEnd: { type: MarkerType.ArrowClosed, width: 10, height: 10, color: 'var(--color-accent)' },
      type: 'smoothstep',
    }));

    return { initialNodes, initialEdges };
  }, [tables, allSchemas]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update when data changes
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  if (tables.length === 0) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
        <span className="text-xs">Connect a device to view schema graph</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.15, maxZoom: 1.2 }}
        style={{ background: 'var(--color-surface-0)' }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        minZoom={0.05}
        maxZoom={2}
      >
        <Background color="var(--color-border-subtle)" gap={32} size={1} />
        <Controls />
        <MiniMap
          nodeColor="var(--color-surface-3)"
          maskColor="rgba(0,0,0,0.3)"
        />
      </ReactFlow>
    </div>
  );
}
