import type { FunnelRFNode, FunnelRFEdge, FunnelNodeType } from './types'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ValidationSeverity = 'error' | 'warning'

export interface ValidationIssue {
  id: string
  severity: ValidationSeverity
  title: string
  description: string
  nodeId?: string
}

// ─── Tipos de nodo que generan tráfico propio ─────────────────────────────────

const SOURCE_TYPES = new Set<FunnelNodeType>([
  'trafficSource', 'reels', 'organicPost', 'podcast', 'influencer',
  'community', 'pr', 'marketplace', 'qrOffline',
  'linkedinAds', 'twitterAds', 'pinterestAds', 'youtubeAds',
  'paidTraffic', 'organicTraffic', 'trafficEntry',
])

// ─── Validador principal ──────────────────────────────────────────────────────

export function validateFunnel(
  nodes: FunnelRFNode[],
  edges: FunnelRFEdge[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // ── Canvas vacío ──────────────────────────────────────────────────────────
  if (nodes.length === 0) {
    issues.push({
      id: 'empty-canvas',
      severity: 'error',
      title: 'Canvas vacío',
      description: 'Agregá al menos una fuente de tráfico y un nodo de conversión para simular.',
    })
    return issues
  }

  // ── Sin fuente de tráfico ─────────────────────────────────────────────────
  const hasSources = nodes.some(n => SOURCE_TYPES.has(n.data.nodeType))
  if (!hasSources) {
    issues.push({
      id: 'no-traffic-source',
      severity: 'error',
      title: 'Sin fuente de tráfico',
      description: 'Agregá al menos una fuente de tráfico para poder simular tu funnel.',
    })
  }

  // ── Nodos sin ninguna conexión (aislados) ─────────────────────────────────
  const connectedIds = new Set<string>()
  for (const edge of edges) {
    connectedIds.add(edge.source)
    connectedIds.add(edge.target)
  }

  // Un nodo aislado: ni es fuente con output ni recibe input
  // (las fuentes sin output se detectan por separado)
  const isolated = nodes.filter(n => !connectedIds.has(n.id))
  if (isolated.length > 0) {
    const names = isolated.map(n => `"${n.data.label}"`).join(', ')
    issues.push({
      id: 'isolated-nodes',
      severity: isolated.some(n => !SOURCE_TYPES.has(n.data.nodeType)) ? 'warning' : 'warning',
      title: `${isolated.length} nodo${isolated.length > 1 ? 's' : ''} sin conectar`,
      description: `${names} no ${isolated.length > 1 ? 'están conectados' : 'está conectado'} al flujo. No recibirán tráfico y serán ignorados en la simulación.`,
    })
  }

  // ── Fuente de tráfico sin salida ──────────────────────────────────────────
  const sourceNodes = nodes.filter(n => SOURCE_TYPES.has(n.data.nodeType))
  const sourcesWithoutOutput = sourceNodes.filter(
    n => !edges.some(e => e.source === n.id)
  )
  for (const node of sourcesWithoutOutput) {
    issues.push({
      id: `source-no-output-${node.id}`,
      severity: 'error',
      title: `"${node.data.label}" no tiene salida`,
      description: 'Esta fuente de tráfico genera visitantes, pero no está conectada a ningún nodo. El tráfico no va a ningún lado.',
      nodeId: node.id,
    })
  }

  // ── Nodos intermedios sin entrada ─────────────────────────────────────────
  const nonSourceNodes = nodes.filter(n => !SOURCE_TYPES.has(n.data.nodeType))
  const nodesWithoutInput = nonSourceNodes.filter(
    n => n.data.nodeType !== 'stickyNote' && n.data.nodeType !== 'groupContainer'
      && !edges.some(e => e.target === n.id)
  )
  for (const node of nodesWithoutInput) {
    // Ya cubiertos en "isolated-nodes" si tampoco tienen output
    if (!edges.some(e => e.source === node.id)) continue
    issues.push({
      id: `no-input-${node.id}`,
      severity: 'warning',
      title: `"${node.data.label}" no recibe tráfico`,
      description: 'Este nodo tiene salida pero ningún nodo lo alimenta. Recibirá 0 visitantes.',
      nodeId: node.id,
    })
  }

  // ── Split con porcentajes incorrectos ─────────────────────────────────────
  for (const node of nodes) {
    if (node.data.nodeType !== 'split' && node.data.nodeType !== 'abSplitTest') continue
    const branches = (node.data.config as { branches?: Array<{ percentage: number }> }).branches
    if (!branches || branches.length === 0) continue
    const total = branches.reduce((sum, b) => sum + (b.percentage ?? 0), 0)
    if (Math.abs(total - 100) > 1) {
      issues.push({
        id: `split-pct-${node.id}`,
        severity: 'error',
        title: `"${node.data.label}" mal configurado`,
        description: `Las ramas suman ${total.toFixed(0)}% en lugar de 100%. Ajustá los porcentajes para que el total sea exactamente 100%.`,
        nodeId: node.id,
      })
    }
  }

  // ── Un solo nodo que no es fuente ─────────────────────────────────────────
  if (nodes.length === 1 && !SOURCE_TYPES.has(nodes[0].data.nodeType)) {
    issues.push({
      id: 'single-non-source',
      severity: 'error',
      title: 'Nodo único no es fuente de tráfico',
      description: 'El único nodo en el canvas no genera tráfico. Agregá una fuente de tráfico y conéctalos.',
    })
  }

  // ── Sin nodo de resultado ──────────────────────────────────────────────────
  const resultNodes = nodes.filter(n => n.data.nodeType === 'result')
  if (resultNodes.length === 0) {
    issues.push({
      id: 'no-result-node',
      severity: 'error',
      title: 'Falta el nodo "Resultado"',
      description: 'El funnel necesita un nodo de Resultado al final del flujo para cerrar el recorrido y mostrar las métricas. Encontralo en la barra lateral izquierda.',
    })
  }

  // ── Nodo de resultado sin entrada ─────────────────────────────────────────
  for (const resultNode of resultNodes) {
    if (!edges.some(e => e.target === resultNode.id)) {
      issues.push({
        id: `result-no-input-${resultNode.id}`,
        severity: 'error',
        title: `"${resultNode.data.label}" no está conectado`,
        description: 'El nodo de Resultado existe pero no tiene ninguna conexión entrante. El flujo no terminará ahí. Conectá al menos un nodo anterior a él para cerrar el recorrido.',
        nodeId: resultNode.id,
      })
    }
  }

  return issues
}

/** Retorna true si hay al menos un error bloqueante. */
export function hasBlockingErrors(issues: ValidationIssue[]): boolean {
  return issues.some(i => i.severity === 'error')
}
