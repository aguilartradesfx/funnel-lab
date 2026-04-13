'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
  type FinalConnectionState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useFunnelStore } from '@/stores/funnelStore'
import FunnelNode from './FunnelNode'
import FunnelEdge from './FunnelEdge'
import ContextMenu from './ContextMenu'
import type { FunnelNodeType } from '@/lib/types'
import { getNodeColor } from '@/lib/nodeDefinitions'

// Registrar tipos personalizados una sola vez fuera del componente
const nodeTypes: NodeTypes = { funnelNode: FunnelNode }
const edgeTypes: EdgeTypes = { funnelEdge: FunnelEdge }

const defaultEdgeOptions = {
  type: 'funnelEdge',
  animated: false,
}

export default function FunnelCanvas() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition, fitView } = useReactFlow()

  const nodes = useFunnelStore(s => s.nodes)
  const edges = useFunnelStore(s => s.edges)

  // ── fitView después de auto-layout ───────────────────────────────────────
  const shouldFitView = useFunnelStore(s => s.shouldFitView)
  const setShouldFitView = useFunnelStore(s => s.setShouldFitView)
  useEffect(() => {
    if (shouldFitView) {
      fitView({ duration: 500, padding: 0.25 })
      setShouldFitView(false)
    }
  }, [shouldFitView, fitView, setShouldFitView])

  // ── Context menu ─────────────────────────────────────────────────────────
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; nodeId: string | null
  } | null>(null)

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: { id: string }) => {
    event.preventDefault()
    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id })
  }, [])

  const onPaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault()
    setContextMenu({ x: (event as React.MouseEvent).clientX, y: (event as React.MouseEvent).clientY, nodeId: null })
  }, [])
  const onNodesChange = useFunnelStore(s => s.onNodesChange)
  const onEdgesChange = useFunnelStore(s => s.onEdgesChange)
  const onConnect = useFunnelStore(s => s.onConnect)
  const addNode = useFunnelStore(s => s.addNode)
  const setSelectedNode = useFunnelStore(s => s.setSelectedNode)
  const setQuickAddSource = useFunnelStore(s => s.setQuickAddSource)

  // Abrir QuickAdd al soltar una línea en el canvas vacío
  const onConnectEnd = useCallback(
    (_event: MouseEvent | TouchEvent, state: FinalConnectionState) => {
      if (!state.isValid && state.fromNode) {
        setQuickAddSource(state.fromNode.id)
      }
    },
    [setQuickAddSource]
  )

  // ── Drag & Drop desde el sidebar ────────────────────────────────────────

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const nodeType = event.dataTransfer.getData('application/funnel-node-type') as FunnelNodeType
      if (!nodeType) return

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      addNode(nodeType, position)
    },
    [screenToFlowPosition, addNode]
  )

  // ── Click en canvas vacío ────────────────────────────────────────────────

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [setSelectedNode])

  return (
    <div ref={wrapperRef} className="w-full h-full" onContextMenu={e => e.preventDefault()}>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          onClose={() => setContextMenu(null)}
        />
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onPaneClick={() => { setContextMenu(null); onPaneClick() }}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
        minZoom={0.2}
        maxZoom={2}
        snapToGrid
        snapGrid={[20, 20]}
        deleteKeyCode={null}
        multiSelectionKeyCode="Shift"
        selectionOnDrag
        panOnDrag={[1, 2]}  // botón medio y derecho para pan; izquierdo = selección
        selectNodesOnDrag={false}
        elevateEdgesOnSelect
        // Trackpad: scroll = pan (como Figma/Miro/n8n)
        // Cmd/Ctrl + scroll = zoom
        panOnScroll
        panOnScrollSpeed={0.5}
        zoomOnScroll={false}         // scroll libre = pan, no zoom
        zoomActivationKeyCode="Meta" // solo Cmd/Ctrl activa zoom con scroll
        zoomOnPinch                  // pinch en trackpad = zoom
        className="bg-[#191919]"
        proOptions={{ hideAttribution: true }}
      >
        {/* Grid de puntos — gap=20 coincide con snapGrid={[20,20]} */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color="#333333"
        />

        {/* Controles de zoom */}
        <Controls
          position="bottom-left"
          showInteractive={false}
        />

        {/* Mini-mapa */}
        <MiniMap
          position="bottom-right"
          nodeColor={(node) => {
            const nodeType = (node.data as { nodeType?: FunnelNodeType })?.nodeType
            if (!nodeType) return '#1e1e32'
            return getNodeColor(nodeType).border
          }}
          nodeBorderRadius={4}
          maskColor="rgba(0,0,0,0.6)"
          zoomable
          pannable
        />

        {/* Placeholder cuando el canvas está vacío */}
        {nodes.length === 0 && <EmptyCanvasHint />}
      </ReactFlow>
    </div>
  )
}

function EmptyCanvasHint() {
  const { screenToFlowPosition } = useReactFlow()
  const addNode = useFunnelStore(s => s.addNode)
  const setSelectedNode = useFunnelStore(s => s.setSelectedNode)

  const handleAddTrafficEntry = useCallback(() => {
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    const pos = screenToFlowPosition({ x: centerX, y: centerY })
    addNode('trafficEntry', { x: pos.x - 110, y: pos.y - 60 })
    // Zustand state is synchronous — grab the freshly added node
    const nodes = useFunnelStore.getState().nodes
    const newNode = nodes[nodes.length - 1]
    if (newNode) setSelectedNode(newNode.id)
  }, [addNode, screenToFlowPosition, setSelectedNode])

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
      style={{ zIndex: 5 }}
    >
      <div className="text-center max-w-sm">
        <button
          onClick={handleAddTrafficEntry}
          className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4
                     hover:bg-orange-500/20 hover:border-orange-500/40 transition-all cursor-pointer pointer-events-auto"
          title="Agregar fuente de tráfico"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-slate-300 mb-1">Canvas vacío</h3>
        <p className="text-sm text-orange-400/80 font-medium mb-1">
          Hacé clic en el + para agregar tu primera fuente de tráfico
        </p>
        <p className="text-sm text-slate-500 leading-relaxed">
          o arrastrá nodos desde el panel izquierdo.
        </p>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1">
            <kbd className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 font-mono">Scroll</kbd>
            Zoom
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 font-mono">Clic+Drag</kbd>
            Selección
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 font-mono">Del</kbd>
            Eliminar
          </span>
        </div>
      </div>
    </div>
  )
}
