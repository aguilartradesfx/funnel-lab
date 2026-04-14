'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
  opacityTarget: number
  opacitySpeed: number
}

interface TravelLine {
  x: number
  y: number
  angle: number
  length: number
  speed: number
  opacity: number
  maxOpacity: number
  phase: 'fadein' | 'travel' | 'fadeout'
  traveled: number
  travelMax: number
  strokeWidth: number
}

export default function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let W = window.innerWidth
    let H = window.innerHeight

    const setSize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W
      canvas.height = H
    }
    setSize()

    // ── Scroll lag tracking ───────────────────────────────────────────────────
    let targetScrollY = window.scrollY
    let smoothScrollY = window.scrollY
    let prevSmoothScrollY = window.scrollY
    const LERP = 0.055 // lower = more lag; 0.055 ≈ comfortable delay

    // ── Particles ─────────────────────────────────────────────────────────────
    const PARTICLE_COUNT = 70
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.2 + 0.4,
      opacity: Math.random() * 0.15,
      opacityTarget: Math.random() * 0.2 + 0.04,
      opacitySpeed: Math.random() * 0.004 + 0.001,
    }))

    // ── Lines ─────────────────────────────────────────────────────────────────
    const MAX_LINES = 6
    const lines: TravelLine[] = []

    function makeLine(): TravelLine {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        angle: Math.random() * Math.PI * 2,
        length: Math.random() * 120 + 60,
        speed: Math.random() * 0.7 + 0.25,
        opacity: 0,
        maxOpacity: Math.random() * 0.09 + 0.03,
        phase: 'fadein',
        traveled: 0,
        travelMax: Math.random() * 400 + 150,
        strokeWidth: Math.random() * 0.4 + 0.2,
      }
    }

    // ── Tick ──────────────────────────────────────────────────────────────────
    function tick() {
      ctx.clearRect(0, 0, W, H)

      // Compute lagged scroll delta
      targetScrollY = window.scrollY
      smoothScrollY += (targetScrollY - smoothScrollY) * LERP
      const scrollDelta = smoothScrollY - prevSmoothScrollY
      prevSmoothScrollY = smoothScrollY

      // Spawn lines occasionally
      if (lines.length < MAX_LINES && Math.random() < 0.004) {
        lines.push(makeLine())
      }

      // ── Draw particles ──────────────────────────────────────────────────────
      for (const p of particles) {
        // Natural drift
        p.x += p.vx
        p.y += p.vy
        // Scroll lag offset
        p.y -= scrollDelta

        // Wrap around viewport
        if (p.x < 0) p.x = W
        if (p.x > W) p.x = 0
        if (p.y < -20) p.y = H + 20
        if (p.y > H + 20) p.y = -20

        // Pulse opacity
        if (p.opacity < p.opacityTarget) {
          p.opacity = Math.min(p.opacity + p.opacitySpeed, p.opacityTarget)
        } else {
          p.opacity = Math.max(p.opacity - p.opacitySpeed, 0)
          if (p.opacity === 0) {
            p.opacityTarget = Math.random() * 0.2 + 0.04
            p.vx += (Math.random() - 0.5) * 0.06
            p.vy += (Math.random() - 0.5) * 0.06
            p.vx = Math.max(-0.5, Math.min(0.5, p.vx))
            p.vy = Math.max(-0.5, Math.min(0.5, p.vy))
          }
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${p.opacity.toFixed(3)})`
        ctx.fill()
      }

      // ── Draw lines ──────────────────────────────────────────────────────────
      for (let i = lines.length - 1; i >= 0; i--) {
        const l = lines[i]

        // Scroll lag on lines too
        l.y -= scrollDelta

        if (l.phase === 'fadein') {
          l.opacity += 0.0015
          if (l.opacity >= l.maxOpacity) { l.opacity = l.maxOpacity; l.phase = 'travel' }
        } else if (l.phase === 'travel') {
          const step = l.speed
          l.x += Math.cos(l.angle) * step
          l.y += Math.sin(l.angle) * step
          l.traveled += step
          if (l.traveled >= l.travelMax) l.phase = 'fadeout'
        } else {
          l.opacity -= 0.0015
          if (l.opacity <= 0) { lines.splice(i, 1); continue }
        }

        const x2 = l.x + Math.cos(l.angle) * l.length
        const y2 = l.y + Math.sin(l.angle) * l.length

        const grad = ctx.createLinearGradient(l.x, l.y, x2, y2)
        grad.addColorStop(0, 'rgba(255,255,255,0)')
        grad.addColorStop(0.25, `rgba(255,255,255,${l.opacity.toFixed(3)})`)
        grad.addColorStop(0.75, `rgba(255,255,255,${l.opacity.toFixed(3)})`)
        grad.addColorStop(1, 'rgba(255,255,255,0)')

        ctx.beginPath()
        ctx.moveTo(l.x, l.y)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = grad
        ctx.lineWidth = l.strokeWidth
        ctx.stroke()
      }

      animId = requestAnimationFrame(tick)
    }

    tick()

    const onResize = () => {
      setSize()
      for (const p of particles) {
        p.x = Math.random() * W
        p.y = Math.random() * H
      }
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
