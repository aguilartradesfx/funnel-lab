'use client'

import { useEffect, useCallback } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { useFunnelStore } from '@/stores/funnelStore'
import { EditorContext, type EditorScenario, type EditorUser, type EditorPlan } from '@/contexts/EditorContext'
import EditorToolbar from './toolbar/EditorToolbar'
import NodeLibrary from './sidebar/NodeLibrary'
import FunnelCanvas from './canvas/FunnelCanvas'
import NodeConfigPanel from './panels/NodeConfigPanel'
import RightPanel from './panels/RightPanel'
import TemplateLibrary from './templates/TemplateLibrary'
import ValidationModal from './panels/ValidationModal'
import QuickAddPopup from './panels/QuickAddPopup'
import HelpModal from './panels/HelpModal'
import ProductsModal from './products/ProductsModal'

interface FunnelEditorProps {
  projectId?: string
  scenarios?: EditorScenario[]
  activeScenarioId?: string | null
  onSwitchScenario?: (id: string) => void
  onCreateScenario?: (name: string) => Promise<void>
  onRenameScenario?: (id: string, name: string) => Promise<void>
  onDeleteScenario?: (id: string) => Promise<void>
  user?: EditorUser | null
  plan?: EditorPlan | null
}

export default function FunnelEditor({
  projectId,
  scenarios = [],
  activeScenarioId = null,
  onSwitchScenario = () => {},
  onCreateScenario = async () => {},
  onRenameScenario = async () => {},
  onDeleteScenario = async () => {},
  user = null,
  plan = null,
}: FunnelEditorProps = {}) {
  const undo = useFunnelStore(s => s.undo)
  const redo = useFunnelStore(s => s.redo)
  const simulate = useFunnelStore(s => s.simulate)
  const isSidebarOpen = useFunnelStore(s => s.isSidebarOpen)
  const copySelectedNode = useFunnelStore(s => s.copySelectedNode)
  const pasteNode = useFunnelStore(s => s.pasteNode)
  const selectedNodeId = useFunnelStore(s => s.selectedNodeId)
  const duplicateNode = useFunnelStore(s => s.duplicateNode)
  const deleteSelectedElements = useFunnelStore(s => s.deleteSelectedElements)
  const setSelectedNode = useFunnelStore(s => s.setSelectedNode)
  const toggleConfigPanel = useFunnelStore(s => s.toggleConfigPanel)
  const toggleHelp = useFunnelStore(s => s.toggleHelp)

  // ── Atajos de teclado globales ──────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const ctrl = e.ctrlKey || e.metaKey

      // Undo / Redo
      if (ctrl && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); return }
      if (ctrl && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); return }

      // Simular
      if (ctrl && e.key === 'Enter') { e.preventDefault(); simulate(); return }

      // Copiar / Pegar
      if (ctrl && e.key === 'c') { e.preventDefault(); copySelectedNode(); return }
      if (ctrl && e.key === 'v') { e.preventDefault(); pasteNode(); return }

      // Duplicar (Ctrl+D o Alt+D)
      if ((ctrl && e.key === 'd') || (e.altKey && e.key === 'd')) {
        e.preventDefault()
        if (selectedNodeId) duplicateNode(selectedNodeId)
        return
      }

      // Eliminar — delega a deleteSelectedElements que usa node.selected / edge.selected
      // (evita el conflicto de selectedNodeId stale cuando el usuario tiene una arista seleccionada)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteSelectedElements()
        return
      }

      // Escape — cerrar panels / deseleccionar
      if (e.key === 'Escape') {
        setSelectedNode(null)
        toggleConfigPanel(false)
        return
      }

      // F1 — abrir/cerrar ayuda
      if (e.key === 'F1') { e.preventDefault(); toggleHelp(); return }
    },
    [undo, redo, simulate, copySelectedNode, pasteNode, selectedNodeId, duplicateNode, deleteSelectedElements, setSelectedNode, toggleConfigPanel, toggleHelp]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const editorCtx = {
    user: user ?? null,
    plan: plan ?? null,
    scenarios,
    activeScenarioId,
    onSwitchScenario,
    onCreateScenario,
    onRenameScenario,
    onDeleteScenario,
  }

  return (
    <EditorContext.Provider value={editorCtx}>
    <ReactFlowProvider>
      <div className="flex flex-col h-screen overflow-hidden bg-[#191919]">
        {/* Toolbar superior */}
        <EditorToolbar />

        {/* Área principal */}
        <div className="flex flex-1 overflow-hidden">
          {/* Canvas central */}
          <main className="flex-1 relative overflow-hidden">
            <FunnelCanvas />
            {/* Barra flotante de nodos */}
            {isSidebarOpen && <NodeLibrary />}
          </main>

          {/* Panel derecho unificado (resultados + chat) */}
          <RightPanel />
        </div>

        {/* Panel de configuración de nodo (popup flotante) */}
        <NodeConfigPanel />

        {/* Quick-add popup (agregar nodo siguiente) */}
        <QuickAddPopup />

        {/* Modal de templates */}
        <TemplateLibrary />

        {/* Modal de validación */}
        <ValidationModal />

        {/* Manual de ayuda */}
        <HelpModal />

        {/* Modal de productos */}
        <ProductsModal />
      </div>
    </ReactFlowProvider>
    </EditorContext.Provider>
  )
}
