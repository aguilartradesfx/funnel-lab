import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, decimals = 0): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`
  }
  return `$${value.toLocaleString('es-CR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

export function formatCurrencyFull(value: number): string {
  return `$${value.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return value.toLocaleString('es-CR')
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatRoas(value: number): string {
  return `${value.toFixed(2)}x`
}

export function formatMultiplier(value: number): string {
  return `${value.toFixed(1)}x`
}

export function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

// Determina si un profit es positivo, break-even o negativo
export function getProfitStatus(roi: number): 'positive' | 'neutral' | 'negative' {
  if (roi > 10) return 'positive'
  if (roi > 0) return 'neutral'
  return 'negative'
}

export function getProfitColor(roi: number): string {
  const status = getProfitStatus(roi)
  if (status === 'positive') return 'text-emerald-400'
  if (status === 'neutral') return 'text-amber-400'
  return 'text-red-400'
}
