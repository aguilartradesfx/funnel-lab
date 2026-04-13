'use client'

import { useState } from 'react'
import {
  getBezierPath,
  getSmoothStepPath,
  type EdgeProps,
  type Edge,
  EdgeLabelRenderer,
} from '@xyflow/react'
import { Plus } from 'lucide-react'
import type { FunnelEdgeData } from '@/lib/types'
import { useFunnelStore } from '@/stores/funnelStore'

const PATH_COLORS = {
  yes: '#22c55e',
  no: '#ef4444',
  default: '#4a4a4a',
  'branch-0': '#f97316',
  'branch-1': '#6b7280',
  'branch-2': '#4b5563',
  'branch-3': '#374151',
}

const PATH_LABELS: Record<string, string> = {
  yes: 'Sí',
  no: 'No',
}

// ─── Routing ──────────────────────────────────────────────────────────────

type PathResult = [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number]

function smartPath(params: {
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: Parameters<typeof getBezierPath>[0]['sourcePosition']
  targetPosition: Parameters<typeof getBezierPath>[0]['targetPosition']
}): PathResult {
  const { sourceX, sourceY, targetX, targetY } = params
  const dx = targetX - sourceX   // positivo = target adelante
  const dy = Math.abs(targetY - sourceY)

  // Línea recta cuando los nodos están alineados horizontalmente (±4px)
  if (dy <= 4) {
    const midX = (sourceX + targetX) / 2
    return [`M ${sourceX} ${sourceY} L ${targetX} ${targetY}`, midX, sourceY, 0, 0]
  }

  // Conexión hacia adelante (target a la derecha): curva bezier suave
  if (dx > 0) {
    return getBezierPath({ ...params, curvature: 0.35 }) as PathResult
  }

  // Loopback / target detrás o en misma columna: codos ortogonales con esquinas redondeadas
  return getSmoothStepPath({ ...params, borderRadius: 24 }) as PathResult
}

// ─── Edge ─────────────────────────────────────────────────────────────────

type FunnelEdge = Edge<FunnelEdgeData, 'funnelEdge'>

export default function FunnelEdge({
  id,
  source,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  selected,
}: EdgeProps<FunnelEdge>) {
  const setQuickAddEdge = useFunnelStore(s => s.setQuickAddEdge)
  const deleteEdge = useFunnelStore(s => s.deleteEdge)
  const [hovered, setHovered] = useState(false)

  const pathType = data?.pathType ?? 'default'
  const color = PATH_COLORS[pathType as keyof typeof PATH_COLORS] ?? PATH_COLORS.default
  const label = PATH_LABELS[pathType]

  const [edgePath, labelX, labelY] = smartPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  // Centro geométrico del path para posicionar el botón
  const midX = labelX
  const midY = labelY

  const showDelete = hovered || selected

  return (
    <>
      {/* Glow cuando está seleccionado */}
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeOpacity={0.12}
          style={{ filter: 'blur(4px)' }}
        />
      )}

      {/* Path principal */}
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={selected ? 1.8 : 1.2}
        strokeDasharray={pathType === 'no' ? '6 3' : undefined}
        markerEnd={markerEnd}
        style={{
          filter: selected ? `drop-shadow(0 0 3px ${color}60)` : undefined,
          transition: 'stroke-width 0.15s ease',
        }}
      />

      {/* Área de interacción ancha (invisible) — hace fácil hacer hover/click */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => deleteEdge(id)}
      />

      <EdgeLabelRenderer>
        {/* Label Sí/No — oculto mientras hay hover para no tapar el botón */}
        {label && !showDelete && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <span
              style={{
                backgroundColor: color,
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '999px',
                letterSpacing: '0.05em',
              }}
            >
              {label}
            </span>
          </div>
        )}

        {/* Botones hover sobre la línea: + (insertar) y × (eliminar) */}
        {showDelete && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${midX}px,${midY}px)`,
              pointerEvents: 'all',
              zIndex: 20,
              display: 'flex',
              gap: '4px',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {/* + insertar nodo en esta línea */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setQuickAddEdge(id, source, { x: midX, y: midY })
              }}
              className="w-5 h-5 rounded-full flex items-center justify-center
                         bg-[#1c1c1c] border border-[#383838] text-slate-500
                         hover:bg-orange-950 hover:border-orange-700 hover:text-orange-400
                         transition-all shadow-lg"
              title="Insertar nodo aquí"
            >
              <Plus size={10} strokeWidth={2.5} />
            </button>

            {/* × eliminar línea */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteEdge(id)
              }}
              className="w-5 h-5 rounded-full flex items-center justify-center
                         bg-[#1c1c1c] border border-[#383838] text-slate-500
                         hover:bg-red-950 hover:border-red-800 hover:text-red-400
                         transition-all text-[13px] leading-none shadow-lg"
              title="Eliminar conexión"
            >
              ×
            </button>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}
