'use client'

import { useEffect, useRef } from 'react'
import { Copy, Trash2, LayoutGrid, Minus } from 'lucide-react'
import { useFunnelStore } from '@/stores/funnelStore'

interface ContextMenuProps {
  x: number
  y: number
  nodeId: string | null
  onClose: () => void
}

export default function ContextMenu({ x, y, nodeId, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const duplicateNode = useFunnelStore(s => s.duplicateNode)
  const deleteNode = useFunnelStore(s => s.deleteNode)
  const autoLayout = useFunnelStore(s => s.autoLayout)

  // Ajustar posición si queda fuera de pantalla
  const adjustedX = x + 188 > window.innerWidth ? x - 188 : x
  const adjustedY = y + 140 > window.innerHeight ? y - 140 : y

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    // Small delay so the right-click that opened this doesn't immediately close it
    const t = setTimeout(() => {
      document.addEventListener('mousedown', onMouse)
      document.addEventListener('keydown', onKey)
    }, 60)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const item = (
    label: string,
    Icon: React.ElementType,
    onClick: () => void,
    danger = false
  ) => (
    <button
      onClick={() => { onClick(); onClose() }}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium
                  rounded-lg transition-colors text-left
                  ${danger
                    ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                    : 'text-slate-300 hover:bg-[#242424] hover:text-slate-100'
                  }`}
    >
      <Icon size={13} strokeWidth={1.8} className="flex-shrink-0" />
      {label}
    </button>
  )

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', left: adjustedX, top: adjustedY, zIndex: 9999 }}
      className="bg-[#141414] border border-[#2a2a2a] rounded-xl shadow-2xl p-1.5 min-w-[188px] animate-fade-in"
    >
      {nodeId && (
        <>
          {item('Duplicar nodo', Copy, () => duplicateNode(nodeId))}
          {item('Eliminar nodo', Trash2, () => deleteNode(nodeId), true)}
          <div className="h-px bg-[#242424] my-1 mx-1" />
        </>
      )}
      {item('Organizar flujo', LayoutGrid, () => autoLayout())}
    </div>
  )
}
