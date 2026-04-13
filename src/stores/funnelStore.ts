import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react'
import { v4 as uuid } from 'uuid'
import type {
  FunnelRFNode,
  FunnelRFEdge,
  FunnelNodeType,
  NodeConfig,
  GlobalSimResults,
  HistorySnapshot,
  FunnelProject,
  Blueprint,
  SimRun,
  Product,
} from '@/lib/types'
import { NODE_DEFINITIONS } from '@/lib/nodeDefinitions'
import { runSimulation, getNodeSimOrder } from '@/lib/simulation'
import { computeAutoLayout } from '@/lib/layout'
import { validateFunnel, hasBlockingErrors, type ValidationIssue } from '@/lib/validation'

// ─── Estado ───────────────────────────────────────────────────────────────────

interface FunnelState {
  // Canvas
  nodes: FunnelRFNode[]
  edges: FunnelRFEdge[]

  // Selección
  selectedNodeId: string | null

  // Proyecto
  projectId: string
  projectName: string

  // Simulación
  simResults: GlobalSimResults | null
  isSimulating: boolean
  hasSimulated: boolean
  simulatingNodeId: string | null
  simJustCompleted: boolean
  simHistory: SimRun[]

  // Layout
  shouldFitView: boolean

  // Historial undo/redo
  history: HistorySnapshot[]
  historyIndex: number

  // Validación
  validationIssues: ValidationIssue[] | null

  // UI
  isSidebarOpen: boolean
  isConfigPanelOpen: boolean
  configPanelMode: 'config' | 'results'
  isSimPanelOpen: boolean
  isTemplateLibraryOpen: boolean
  isAIPanelOpen: boolean

  // Quick-add popup
  quickAddSourceNodeId: string | null
  quickAddEdgeId: string | null
  quickAddFlowPos: { x: number; y: number } | null

  // Clipboard
  clipboard: FunnelRFNode | null

  // Help
  isHelpOpen: boolean

  // Products
  products: Product[]
  isProductsOpen: boolean

  // Sim token (internal — invalidates in-flight animations when topology changes)
  _simToken: number

  // Supabase context (runtime — not persisted)
  supabaseProjectId: string | null
  supabaseScenarioId: string | null
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
}

// ─── Acciones ─────────────────────────────────────────────────────────────────

interface FunnelActions {
  // Cambios de canvas (React Flow)
  onNodesChange: (changes: NodeChange<FunnelRFNode>[]) => void
  onEdgesChange: (changes: EdgeChange<FunnelRFEdge>[]) => void
  onConnect: (connection: Connection) => void

  // Nodos
  addNode: (nodeType: FunnelNodeType, position: { x: number; y: number }) => void
  updateNodeConfig: (nodeId: string, config: Partial<NodeConfig>) => void
  updateNodeLabel: (nodeId: string, label: string) => void
  deleteNode: (nodeId: string) => void
  deleteEdge: (edgeId: string) => void
  deleteSelectedElements: () => void
  disconnectNode: (nodeId: string) => void
  duplicateNode: (nodeId: string) => void
  setSelectedNode: (nodeId: string | null) => void

  // Proyecto
  setProjectName: (name: string) => void
  resetCanvas: () => void
  loadBlueprint: (blueprint: Blueprint) => void
  loadProject: (project: FunnelProject) => void
  exportProject: () => FunnelProject

  // Simulación
  simulate: () => void
  clearSimResults: () => void
  clearValidationIssues: () => void

  // Layout
  autoLayout: () => void
  setShouldFitView: (v: boolean) => void

  // Undo/Redo
  undo: () => void
  redo: () => void
  pushHistory: () => void

  // UI
  toggleSidebar: () => void
  toggleConfigPanel: (open?: boolean) => void
  setConfigPanelMode: (mode: 'config' | 'results') => void
  toggleSimPanel: (open?: boolean) => void
  toggleTemplateLibrary: (open?: boolean) => void
  toggleAIPanel: (open?: boolean) => void

  // Quick-add
  setQuickAddSource: (nodeId: string | null) => void
  addNodeConnected: (sourceNodeId: string, nodeType: FunnelNodeType) => void
  setQuickAddEdge: (edgeId: string, sourceNodeId: string, flowPos: { x: number; y: number }) => void
  insertNodeOnEdge: (edgeId: string, nodeType: FunnelNodeType) => void

  // Clipboard
  copySelectedNode: () => void
  pasteNode: () => void

  // Help
  toggleHelp: (open?: boolean) => void

  // Products
  addProduct: (name: string, price: number, description?: string) => void
  updateProduct: (id: string, patch: Partial<Omit<Product, 'id'>>) => void
  deleteProduct: (id: string) => void
  toggleProducts: (open?: boolean) => void

  // Supabase context
  setSupabaseContext: (projectId: string, scenarioId: string) => void
  setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void
}

type FunnelStore = FunnelState & FunnelActions

// ─── Estado inicial ───────────────────────────────────────────────────────────

const INITIAL_NODES: FunnelRFNode[] = []
const INITIAL_EDGES: FunnelRFEdge[] = []
const MAX_HISTORY = 50

// ─── Store ────────────────────────────────────────────────────────────────────

export const useFunnelStore = create<FunnelStore>()(
  persist(
    immer((set, get) => ({
      // Estado inicial
      nodes: INITIAL_NODES,
      edges: INITIAL_EDGES,
      selectedNodeId: null,
      projectId: uuid(),
      projectName: 'Mi Funnel',
      simResults: null,
      isSimulating: false,
      hasSimulated: false,
      simulatingNodeId: null,
      simJustCompleted: false,
      simHistory: [],
      shouldFitView: false,
      validationIssues: null,
      history: [],
      historyIndex: -1,
      isSidebarOpen: true,
      isConfigPanelOpen: false,
      configPanelMode: 'config' as 'config' | 'results',
      isSimPanelOpen: false,
      isTemplateLibraryOpen: false,
      isAIPanelOpen: false,
      quickAddSourceNodeId: null,
      quickAddEdgeId: null,
      quickAddFlowPos: null,
      clipboard: null,
      isHelpOpen: false,
      products: [],
      isProductsOpen: false,
      _simToken: 0,
      supabaseProjectId: null,
      supabaseScenarioId: null,
      saveStatus: 'idle' as 'idle' | 'saving' | 'saved' | 'error',

      // ─── React Flow handlers ─────────────────────────────────────────────

      onNodesChange: (changes) => {
        set(state => {
          state.nodes = applyNodeChanges(changes, state.nodes) as FunnelRFNode[]
        })
      },

      onEdgesChange: (changes) => {
        const hasRemoves = changes.some(c => c.type === 'remove')
        if (hasRemoves) get().pushHistory()
        set(state => {
          state.edges = applyEdgeChanges(changes, state.edges) as FunnelRFEdge[]
          if (hasRemoves) {
            state.simResults = null
            state.hasSimulated = false
            state._simToken = 0
            state.isSimulating = false
            state.simulatingNodeId = null
          }
        })
      },

      onConnect: (connection) => {
        // Prevent duplicate edges: same source+sourceHandle → same target
        const hasDuplicate = get().edges.some(
          e => e.source === connection.source &&
               e.target === connection.target &&
               (e.sourceHandle ?? null) === (connection.sourceHandle ?? null)
        )
        if (hasDuplicate) return

        get().pushHistory()
        set(state => {
          // Determinar pathType desde el sourceHandle
          const sourceHandle = connection.sourceHandle ?? 'output'
          let pathType: NonNullable<FunnelRFEdge['data']>['pathType'] = 'default'
          if (sourceHandle === 'output-yes') pathType = 'yes'
          else if (sourceHandle === 'output-no') pathType = 'no'
          else if (sourceHandle.startsWith('output-branch-')) {
            pathType = sourceHandle.replace('output-', '') as NonNullable<FunnelRFEdge['data']>['pathType']
          }

          const newEdge: FunnelRFEdge = {
            ...connection,
            id: `e-${uuid()}`,
            type: 'funnelEdge',
            source: connection.source,
            target: connection.target,
            sourceHandle: connection.sourceHandle ?? undefined,
            targetHandle: connection.targetHandle ?? undefined,
            data: { pathType },
          }
          state.edges = addEdge(newEdge, state.edges) as FunnelRFEdge[]
          state.simResults = null
          state.hasSimulated = false
          state._simToken = 0
          state.isSimulating = false
          state.simulatingNodeId = null
        })
      },

      // ─── Nodos ──────────────────────────────────────────────────────────

      addNode: (nodeType, position) => {
        get().pushHistory()
        const def = NODE_DEFINITIONS[nodeType]
        const newNode: FunnelRFNode = {
          id: `node-${uuid()}`,
          type: 'funnelNode',
          position,
          data: {
            nodeType,
            label: def.label,
            config: { ...def.defaultConfig },
          },
        }
        set(state => {
          state.nodes.push(newNode)
          state.selectedNodeId = newNode.id
          state.isConfigPanelOpen = true
          state.simResults = null
          state.hasSimulated = false
        })
      },

      updateNodeConfig: (nodeId, configPatch) => {
        set(state => {
          const node = state.nodes.find(n => n.id === nodeId)
          if (node) {
            node.data.config = { ...node.data.config, ...configPatch }
            state.simResults = null
            state.hasSimulated = false
          }
        })
      },

      updateNodeLabel: (nodeId, label) => {
        set(state => {
          const node = state.nodes.find(n => n.id === nodeId)
          if (node) node.data.label = label
        })
      },

      deleteNode: (nodeId) => {
        get().pushHistory()
        set(state => {
          state.nodes = state.nodes.filter(n => n.id !== nodeId)
          state.edges = state.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
          if (state.selectedNodeId === nodeId) {
            state.selectedNodeId = null
            state.isConfigPanelOpen = false
          }
          state.simResults = null
          state.hasSimulated = false
          state._simToken = 0  // invalidate any in-flight simulation
          state.isSimulating = false
          state.simulatingNodeId = null
        })
      },

      deleteEdge: (edgeId) => {
        const edgeToDelete = get().edges.find(e => e.id === edgeId)
        if (!edgeToDelete) return
        get().pushHistory()
        set(state => {
          // Remove this edge AND any hidden duplicates (same source handle → same target)
          state.edges = state.edges.filter(e =>
            !(e.source === edgeToDelete.source &&
              e.target === edgeToDelete.target &&
              (e.sourceHandle ?? null) === (edgeToDelete.sourceHandle ?? null))
          )
          state.simResults = null
          state.hasSimulated = false
          state._simToken = 0  // invalidate any in-flight simulation
          state.isSimulating = false
          state.simulatingNodeId = null
        })
      },

      disconnectNode: (nodeId) => {
        get().pushHistory()
        set(state => {
          state.edges = state.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
          state.simResults = null
          state.hasSimulated = false
          state._simToken = 0
          state.isSimulating = false
          state.simulatingNodeId = null
        })
      },

      deleteSelectedElements: () => {
        const { nodes, edges } = get()
        // Use ReactFlow's selection state (node.selected / edge.selected) — not our selectedNodeId,
        // which can be out of sync when the user clicks on an edge after clicking a node.
        const selectedNodeIds = nodes.filter(n => n.selected).map(n => n.id)
        const selectedEdgeIds = edges.filter(e => e.selected).map(e => e.id)

        if (selectedNodeIds.length === 0 && selectedEdgeIds.length === 0) return

        get().pushHistory()
        set(state => {
          if (selectedNodeIds.length > 0) {
            state.nodes = state.nodes.filter(n => !selectedNodeIds.includes(n.id))
            state.edges = state.edges.filter(
              e => !selectedNodeIds.includes(e.source) && !selectedNodeIds.includes(e.target)
            )
            if (state.selectedNodeId && selectedNodeIds.includes(state.selectedNodeId)) {
              state.selectedNodeId = null
              state.isConfigPanelOpen = false
            }
          }
          if (selectedEdgeIds.length > 0) {
            state.edges = state.edges.filter(e => !selectedEdgeIds.includes(e.id))
          }
          state.simResults = null
          state.hasSimulated = false
          state._simToken = 0
          state.isSimulating = false
          state.simulatingNodeId = null
        })
      },

      duplicateNode: (nodeId) => {
        get().pushHistory()
        const node = get().nodes.find(n => n.id === nodeId)
        if (!node) return
        const newNode: FunnelRFNode = {
          ...node,
          id: `node-${uuid()}`,
          position: { x: node.position.x + 40, y: node.position.y + 40 },
          data: { ...node.data, config: { ...node.data.config } },
        }
        set(state => {
          state.nodes.push(newNode)
          state.selectedNodeId = newNode.id
        })
      },

      setSelectedNode: (nodeId) => {
        set(state => {
          state.selectedNodeId = nodeId
          state.isConfigPanelOpen = nodeId !== null
          state.configPanelMode = 'config'
        })
      },

      // ─── Proyecto ────────────────────────────────────────────────────────

      setProjectName: (name) => {
        set(state => { state.projectName = name })
      },

      resetCanvas: () => {
        get().pushHistory()
        set(state => {
          state.nodes = []
          state.edges = []
          state.selectedNodeId = null
          state.simResults = null
          state.hasSimulated = false
          state.isConfigPanelOpen = false
          state.isSimPanelOpen = false
        })
      },

      loadBlueprint: (blueprint) => {
        get().pushHistory()
        set(state => {
          state.nodes = blueprint.nodes.map(n => ({ ...n }))
          state.edges = blueprint.edges.map(e => ({ ...e }))
          state.selectedNodeId = null
          state.simResults = null
          state.hasSimulated = false
          state.isConfigPanelOpen = false
          state.isTemplateLibraryOpen = false
        })
      },

      loadProject: (project) => {
        set(state => {
          state.projectId = project.id
          state.projectName = project.name
          state.nodes = project.nodes
          state.edges = project.edges
          state.products = project.products ?? []
          state.selectedNodeId = null
          state.simResults = null
          state.hasSimulated = false
        })
      },

      exportProject: () => {
        const state = get()
        return {
          id: state.projectId,
          name: state.projectName,
          description: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          nodes: state.nodes,
          edges: state.edges,
          products: state.products,
        }
      },

      // ─── Simulación ──────────────────────────────────────────────────────

      simulate: () => {
        const { nodes, edges } = get()

        // Validar antes de simular
        const issues = validateFunnel(nodes, edges)
        if (issues.length > 0) {
          set(state => { state.validationIssues = issues })
          // Si hay errores bloqueantes, no continuar
          if (hasBlockingErrors(issues)) return
        }

        // Token único para esta ejecución — si el usuario elimina una arista
        // mientras la animación está corriendo, el token cambia a 0 y los
        // timeouts de esta ejecución se descartan sin aplicar resultados viejos.
        const token = Date.now()

        set(state => {
          state._simToken = token
          state.isSimulating = true
          state.simulatingNodeId = null
          state.simJustCompleted = false
          state.validationIssues = null
        })

        const order = getNodeSimOrder(nodes, edges)
        const results = runSimulation(nodes, edges)

        // ── BFS independiente sobre las edges actuales ──────────────────────
        const SRC_TYPES = new Set([
          'trafficSource', 'reels', 'organicPost', 'podcast', 'influencer',
          'community', 'pr', 'marketplace', 'qrOffline',
          'linkedinAds', 'twitterAds', 'pinterestAds', 'youtubeAds',
          'paidTraffic', 'organicTraffic', 'trafficEntry',
        ])
        const outMap: Record<string, string[]> = {}
        for (const n of nodes) outMap[n.id] = []
        for (const e of edges) { if (outMap[e.source]) outMap[e.source].push(e.target) }

        const reachable = new Set<string>()
        const bfsQ: string[] = []
        for (const n of nodes) {
          if (SRC_TYPES.has(n.data.nodeType) && outMap[n.id].length > 0) {
            reachable.add(n.id)
            bfsQ.push(n.id)
          }
        }
        while (bfsQ.length > 0) {
          const nid = bfsQ.shift()!
          for (const tid of outMap[nid]) {
            if (!reachable.has(tid)) { reachable.add(tid); bfsQ.push(tid) }
          }
        }

        const animOrder = order.filter(nodeId => {
          const nodeResult = results.nodeResults[nodeId]
          if (!nodeResult) return false
          return reachable.has(nodeId) && nodeResult.visitorsIn > 0
        })

        // Animar nodos uno a uno — se descarta si el token cambió (topología modificada)
        const NODE_DELAY = 140  // ms por nodo
        animOrder.forEach((nodeId, i) => {
          setTimeout(() => {
            if (get()._simToken !== token) return  // simulación invalidada
            set(state => { state.simulatingNodeId = nodeId })
          }, i * NODE_DELAY)
        })

        const totalDelay = animOrder.length * NODE_DELAY + 200
        setTimeout(() => {
          // Si el token cambió (arista eliminada, nodo eliminado, nueva simulación iniciada)
          // descartamos estos resultados — son de una topología que ya no existe.
          if (get()._simToken !== token) {
            set(state => {
              state.isSimulating = false
              state.simulatingNodeId = null
            })
            return
          }

          const { projectName } = get()
          const run: SimRun = {
            id: `run-${Date.now()}`,
            timestamp: new Date().toISOString(),
            projectName,
            nodeCount: nodes.length,
            results,
          }
          set(state => {
            state.nodes = state.nodes.map(node => ({
              ...node,
              data: {
                ...node.data,
                simResult: results.nodeResults[node.id],
              },
            }))
            state.simResults = results
            state.isSimulating = false
            state.hasSimulated = true
            state.simulatingNodeId = null
            state.simJustCompleted = true
            state.isSimPanelOpen = true
            // Agregar al historial (máximo 20 ejecuciones)
            state.simHistory = [run, ...state.simHistory].slice(0, 20)
          })
          setTimeout(() => {
            set(state => { state.simJustCompleted = false })
          }, 2000)
        }, totalDelay)
      },

      clearValidationIssues: () => {
        set(state => { state.validationIssues = null })
      },

      clearSimResults: () => {
        set(state => {
          state.simResults = null
          state.hasSimulated = false
          state.simulatingNodeId = null
          state.simJustCompleted = false
          state.nodes = state.nodes.map(node => ({
            ...node,
            data: { ...node.data, simResult: undefined },
          }))
        })
      },

      // ─── Layout ──────────────────────────────────────────────────────────

      autoLayout: () => {
        get().pushHistory()
        const { nodes, edges } = get()
        const positions = computeAutoLayout(nodes, edges)
        set(state => {
          state.nodes = state.nodes.map(n => {
            const pos = positions.get(n.id)
            return pos ? { ...n, position: pos } : n
          })
          state.shouldFitView = true
        })
      },

      setShouldFitView: (v) => {
        set(state => { state.shouldFitView = v })
      },

      // ─── Undo/Redo ───────────────────────────────────────────────────────

      pushHistory: () => {
        const { nodes, edges, history, historyIndex } = get()
        const snapshot: HistorySnapshot = {
          nodes: nodes.map(n => ({ ...n, data: { ...n.data } })),
          edges: edges.map(e => ({ ...e })),
        }
        set(state => {
          // Eliminar estados futuros si estamos en medio de la historia
          const newHistory = state.history.slice(0, state.historyIndex + 1)
          newHistory.push(snapshot)
          // Limitar historial
          if (newHistory.length > MAX_HISTORY) newHistory.shift()
          state.history = newHistory
          state.historyIndex = newHistory.length - 1
        })
      },

      undo: () => {
        const { historyIndex, history } = get()
        if (historyIndex <= 0) return
        const prevIndex = historyIndex - 1
        const snapshot = history[prevIndex]
        set(state => {
          state.nodes = snapshot.nodes
          state.edges = snapshot.edges
          state.historyIndex = prevIndex
          state.simResults = null
          state.hasSimulated = false
        })
      },

      redo: () => {
        const { historyIndex, history } = get()
        if (historyIndex >= history.length - 1) return
        const nextIndex = historyIndex + 1
        const snapshot = history[nextIndex]
        set(state => {
          state.nodes = snapshot.nodes
          state.edges = snapshot.edges
          state.historyIndex = nextIndex
          state.simResults = null
          state.hasSimulated = false
        })
      },

      // ─── UI ─────────────────────────────────────────────────────────────

      toggleSidebar: () => {
        set(state => { state.isSidebarOpen = !state.isSidebarOpen })
      },

      toggleConfigPanel: (open) => {
        set(state => {
          state.isConfigPanelOpen = open !== undefined ? open : !state.isConfigPanelOpen
          if (!state.isConfigPanelOpen) state.configPanelMode = 'config'
        })
      },

      setConfigPanelMode: (mode) => {
        set(state => {
          state.configPanelMode = mode
          state.isConfigPanelOpen = true
        })
      },

      toggleSimPanel: (open) => {
        set(state => {
          state.isSimPanelOpen = open !== undefined ? open : !state.isSimPanelOpen
        })
      },

      toggleTemplateLibrary: (open) => {
        set(state => {
          state.isTemplateLibraryOpen = open !== undefined ? open : !state.isTemplateLibraryOpen
        })
      },

      toggleAIPanel: (open) => {
        set(state => {
          state.isAIPanelOpen = open !== undefined ? open : !state.isAIPanelOpen
        })
      },

      // ─── Quick-add ───────────────────────────────────────────────────────

      setQuickAddSource: (nodeId) => {
        set(state => {
          state.quickAddSourceNodeId = nodeId
          if (!nodeId) {
            state.quickAddEdgeId = null
            state.quickAddFlowPos = null
          }
        })
      },

      setQuickAddEdge: (edgeId, sourceNodeId, flowPos) => {
        set(state => {
          state.quickAddEdgeId = edgeId
          state.quickAddSourceNodeId = sourceNodeId
          state.quickAddFlowPos = flowPos
        })
      },

      addNodeConnected: (sourceNodeId, nodeType) => {
        const { nodes } = get()
        const sourceNode = nodes.find(n => n.id === sourceNodeId)
        if (!sourceNode) return

        get().pushHistory()

        const def = NODE_DEFINITIONS[nodeType]
        const newNodeId = `node-${uuid()}`

        // Posicionar el nuevo nodo a la derecha de la fuente con un gap de 60px
        const newNode: FunnelRFNode = {
          id: newNodeId,
          type: 'funnelNode',
          position: {
            x: sourceNode.position.x + 280,
            y: sourceNode.position.y,
          },
          data: {
            nodeType,
            label: def.label,
            config: { ...def.defaultConfig },
          },
        }

        const newEdge: FunnelRFEdge = {
          id: `e-${uuid()}`,
          type: 'funnelEdge',
          source: sourceNodeId,
          target: newNodeId,
          sourceHandle: 'output-right',
          targetHandle: 'input-left',
          data: { pathType: 'default' },
        }

        set(state => {
          state.nodes.push(newNode)
          state.edges.push(newEdge)
          state.selectedNodeId = newNodeId
          state.isConfigPanelOpen = true
          state.simResults = null
          state.hasSimulated = false
          state.quickAddSourceNodeId = null
        })
      },

      copySelectedNode: () => {
        const { selectedNodeId, nodes } = get()
        if (!selectedNodeId) return
        const node = nodes.find(n => n.id === selectedNodeId)
        if (!node) return
        set(state => { state.clipboard = node })
      },

      pasteNode: () => {
        const { clipboard } = get()
        if (!clipboard) return
        get().pushHistory()
        const newNodeId = `node-${uuid()}`
        const newNode: FunnelRFNode = {
          ...clipboard,
          id: newNodeId,
          selected: false,
          position: {
            x: clipboard.position.x + 40,
            y: clipboard.position.y + 40,
          },
          data: { ...clipboard.data, config: { ...clipboard.data.config }, simResult: undefined },
        }
        set(state => {
          state.nodes.push(newNode)
          state.selectedNodeId = newNodeId
          state.isConfigPanelOpen = true
        })
      },

      toggleHelp: (open) => {
        set(state => {
          state.isHelpOpen = open !== undefined ? open : !state.isHelpOpen
        })
      },

      insertNodeOnEdge: (edgeId, nodeType) => {
        const { nodes, edges } = get()
        const edge = edges.find(e => e.id === edgeId)
        if (!edge) return
        const sourceNode = nodes.find(n => n.id === edge.source)
        const targetNode = nodes.find(n => n.id === edge.target)
        if (!sourceNode || !targetNode) return

        get().pushHistory()

        const def = NODE_DEFINITIONS[nodeType]
        const newNodeId = `node-${uuid()}`

        // Posicionar en el punto medio, alineado al grid de 20px
        const midX = Math.round(((sourceNode.position.x + targetNode.position.x) / 2) / 20) * 20
        const midY = Math.round(((sourceNode.position.y + targetNode.position.y) / 2) / 20) * 20

        const newNode: FunnelRFNode = {
          id: newNodeId,
          type: 'funnelNode',
          position: { x: midX, y: midY },
          data: {
            nodeType,
            label: def.label,
            config: { ...def.defaultConfig },
          },
        }

        // Arista: fuente → nuevo nodo (misma pathType original)
        const edgeToNew: FunnelRFEdge = {
          id: `e-${uuid()}`,
          type: 'funnelEdge',
          source: edge.source,
          target: newNodeId,
          sourceHandle: edge.sourceHandle,
          targetHandle: 'input-left',
          data: edge.data ?? { pathType: 'default' },
        }

        // Arista: nuevo nodo → destino original
        const edgeFromNew: FunnelRFEdge = {
          id: `e-${uuid()}`,
          type: 'funnelEdge',
          source: newNodeId,
          target: edge.target,
          sourceHandle: 'output-right',
          targetHandle: edge.targetHandle,
          data: { pathType: 'default' },
        }

        set(state => {
          state.edges = state.edges.filter(e => e.id !== edgeId)
          state.nodes.push(newNode)
          state.edges.push(edgeToNew)
          state.edges.push(edgeFromNew)
          state.selectedNodeId = newNodeId
          state.isConfigPanelOpen = true
          state.simResults = null
          state.hasSimulated = false
          state.quickAddEdgeId = null
          state.quickAddSourceNodeId = null
          state.quickAddFlowPos = null
        })
      },
      // ─── Products ────────────────────────────────────────────────────────

      addProduct: (name, price, description) => {
        set(state => {
          state.products.push({ id: uuid(), name, price, description })
        })
      },

      updateProduct: (id, patch) => {
        set(state => {
          const p = state.products.find(p => p.id === id)
          if (p) Object.assign(p, patch)
        })
      },

      deleteProduct: (id) => {
        set(state => {
          state.products = state.products.filter(p => p.id !== id)
        })
      },

      toggleProducts: (open) => {
        set(state => {
          state.isProductsOpen = open !== undefined ? open : !state.isProductsOpen
        })
      },

      setSupabaseContext: (projectId, scenarioId) => {
        set(state => {
          state.supabaseProjectId = projectId
          state.supabaseScenarioId = scenarioId
        })
      },

      setSaveStatus: (status) => {
        set(state => { state.saveStatus = status })
      },
    })),
    {
      name: 'funnel-simulator-state',
      // Solo persistir lo esencial
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        projectId: state.projectId,
        projectName: state.projectName,
        products: state.products,
      }),
    }
  )
)

// ─── Selector helpers ─────────────────────────────────────────────────────────

export const useSelectedNode = () => {
  const selectedNodeId = useFunnelStore(s => s.selectedNodeId)
  const nodes = useFunnelStore(s => s.nodes)
  return nodes.find(n => n.id === selectedNodeId) ?? null
}

export const useCanUndo = () => {
  const historyIndex = useFunnelStore(s => s.historyIndex)
  return historyIndex > 0
}

export const useCanRedo = () => {
  const historyIndex = useFunnelStore(s => s.historyIndex)
  const historyLength = useFunnelStore(s => s.history.length)
  return historyIndex < historyLength - 1
}
