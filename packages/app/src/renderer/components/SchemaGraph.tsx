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
    const visited = new Set<string>();
    const nodeW = 180;
    const nodeH = 44;
    const gapX = 60;
    const gapY = 50;

    // BFS from most connected
    const queue: { name: string; x: number; y: number }[] = [];
    if (sorted.length > 0) {
      queue.push({ name: sorted[0].name, x: 0, y: 0 });
      visited.add(sorted[0].name);
    }

    const maxCols = Math.ceil(Math.sqrt(tables.length));

    while (queue.length > 0) {
      const { name, x, y } = queue.shift()!;
      placed.set(name, { x, y });

      // Place neighbors nearby
      const nbrs = Array.from(neighbors.get(name) || []).filter(n => !visited.has(n));
      const nx = x + nodeW + gapX;
      let ny = y;
      for (const nbr of nbrs) {
        visited.add(nbr);
        queue.push({ name: nbr, x: nx, y: ny });
        ny += nodeH + gapY;
      }
    }

    // Place unvisited nodes in a grid below
    const placedYValues = Array.from(placed.values()).map(p => p.y);
    let unvisitedY = (placedYValues.length > 0 ? Math.max(...placedYValues) : 0) + nodeH + gapY * 3;
    let unvisitedCol = 0;
    for (const t of sorted) {
      if (!placed.has(t.name)) {
        placed.set(t.name, {
          x: unvisitedCol * (nodeW + gapX),
          y: unvisitedY,
        });
        unvisitedCol++;
        if (unvisitedCol >= maxCols) {
          unvisitedCol = 0;
          unvisitedY += nodeH + gapY;
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
          padding: '6px 10px',
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
        style={{ background: 'var(--color-surface-0)' }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background color="var(--color-border-subtle)" gap={24} size={1} />
        <Controls />
        <MiniMap
          nodeColor="var(--color-surface-3)"
          maskColor="rgba(0,0,0,0.3)"
        />
      </ReactFlow>
    </div>
  );
}
