import type { FunnelRFNode, FunnelRFEdge } from './types'

// ─── Constantes de espaciado ──────────────────────────────────────────────

const NODE_W = 220   // ancho de cada nodo
const NODE_H = 120   // alto fijo de cada nodo (= 6×20, alineado al snap grid)
const COL_GAP = 80   // espacio horizontal entre columnas
const ROW_GAP = 40   // espacio vertical — múltiplo de 20 para mantener alineación

const COL_STEP = NODE_W + COL_GAP   // paso horizontal por nivel
const ROW_STEP = NODE_H + ROW_GAP   // paso vertical por nodo en columna

/**
 * Layout izquierda → derecha con alineación vertical por nivel.
 *
 * Cada "nivel" (rank) del grafo se convierte en una columna:
 *   x = rank * COL_STEP
 *   y = posición_en_columna * ROW_STEP   (centrada verticalmente)
 *
 * Los nodos dentro de cada columna se ordenan por la Y promedio
 * de sus padres (barycenter heuristic), de modo que los hijos
 * queden cerca de la altura de sus padres — sin cruzar líneas
 * innecesariamente.
 */
export function computeAutoLayout(
  nodes: FunnelRFNode[],
  edges: FunnelRFEdge[]
): Map<string, { x: number; y: number }> {
  if (nodes.length === 0) return new Map()

  // ── 1. Listas de adyacencia ───────────────────────────────────────────────

  const outgoing = new Map<string, string[]>()
  const incoming = new Map<string, string[]>()

  for (const n of nodes) {
    outgoing.set(n.id, [])
    incoming.set(n.id, [])
  }
  for (const e of edges) {
    if (outgoing.has(e.source)) outgoing.get(e.source)!.push(e.target)
    if (incoming.has(e.target)) incoming.get(e.target)!.push(e.source)
  }

  // ── 2. Asignar rank (columna) por BFS ────────────────────────────────────
  // rank = distancia máxima desde cualquier raíz

  const rank = new Map<string, number>()
  const queue: string[] = []

  for (const n of nodes) {
    if ((incoming.get(n.id)?.length ?? 0) === 0) {
      rank.set(n.id, 0)
      queue.push(n.id)
    }
  }
  if (queue.length === 0) {
    rank.set(nodes[0].id, 0)
    queue.push(nodes[0].id)
  }

  const visited = new Set<string>()
  while (queue.length > 0) {
    const id = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    const cur = rank.get(id) ?? 0
    for (const tgt of (outgoing.get(id) ?? [])) {
      if ((rank.get(tgt) ?? -1) < cur + 1) rank.set(tgt, cur + 1)
      if (!visited.has(tgt)) queue.push(tgt)
    }
  }
  for (const n of nodes) {
    if (!rank.has(n.id)) rank.set(n.id, 0)
  }

  // ── 3. Agrupar por columna ────────────────────────────────────────────────

  const maxRank = Math.max(...rank.values())
  const cols: string[][] = Array.from({ length: maxRank + 1 }, () => [])
  for (const n of nodes) cols[rank.get(n.id) ?? 0].push(n.id)

  // ── 4. Primera pasada: asignar Y provisionales ────────────────────────────
  // Columna 0: centrada en Y=0
  // Columnas siguientes: ordenar por Y promedio de padres (barycenter),
  // luego centrar el grupo.

  const positions = new Map<string, { x: number; y: number }>()

  for (let r = 0; r <= maxRank; r++) {
    const col = cols[r]
    if (col.length === 0) continue

    if (r === 0) {
      // Columna raíz: distribuir centrada en y=0
      placeColumn(col, r, positions)
      continue
    }

    // Ordenar por Y promedio de los padres ya posicionados
    col.sort((a, b) => {
      return parentAvgY(a, incoming, positions) - parentAvgY(b, incoming, positions)
    })

    // Calcular Y "ideal" para cada nodo: promedio de sus padres
    // Luego ajustar para que no se solapen entre sí.
    const idealY = col.map(id => parentAvgY(id, incoming, positions))
    const finalY = resolveOverlaps(idealY, ROW_STEP)

    col.forEach((id, i) => {
      positions.set(id, { x: r * COL_STEP, y: finalY[i] })
    })
  }

  return positions
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Y promedio de todos los padres ya posicionados de un nodo. */
function parentAvgY(
  nodeId: string,
  incoming: Map<string, string[]>,
  positions: Map<string, { x: number; y: number }>
): number {
  const parents = (incoming.get(nodeId) ?? []).filter(p => positions.has(p))
  if (parents.length === 0) return 0
  return parents.reduce((sum, p) => sum + positions.get(p)!.y, 0) / parents.length
}

/** Centra una columna de nodos en y=0 con separación ROW_STEP. */
function placeColumn(
  col: string[],
  rank: number,
  positions: Map<string, { x: number; y: number }>
) {
  const total = col.length * ROW_STEP - ROW_GAP  // altura total del grupo
  const startY = -(total / 2)
  col.forEach((id, i) => {
    positions.set(id, { x: rank * COL_STEP, y: startY + i * ROW_STEP })
  })
}

/**
 * Dado un array de posiciones Y "ideales" (posiblemente solapadas),
 * devuelve posiciones ajustadas que mantienen la separación mínima
 * pero se acercan lo más posible a los valores ideales.
 *
 * Estrategia: expandir desde el centro manteniendo el orden.
 */
function resolveOverlaps(idealY: number[], minGap: number): number[] {
  if (idealY.length === 0) return []
  if (idealY.length === 1) return [idealY[0]]

  // Clonar y respetar el orden relativo
  const result = [...idealY]

  // Pasada hacia abajo: empujar nodos que se solapan hacia abajo
  for (let i = 1; i < result.length; i++) {
    const minY = result[i - 1] + minGap
    if (result[i] < minY) result[i] = minY
  }

  // Pasada hacia arriba: empujar nodos que se solapan hacia arriba
  for (let i = result.length - 2; i >= 0; i--) {
    const maxY = result[i + 1] - minGap
    if (result[i] > maxY) result[i] = maxY
  }

  // Centrar el grupo en torno al centroide ideal
  const idealCenter = idealY.reduce((a, b) => a + b, 0) / idealY.length
  const resultCenter = result.reduce((a, b) => a + b, 0) / result.length
  const shift = idealCenter - resultCenter
  return result.map(y => y + shift)
}
