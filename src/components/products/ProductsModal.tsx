'use client'

import { useState } from 'react'
import { X, Plus, Trash2, Pencil, Check, Package } from 'lucide-react'
import { useFunnelStore } from '@/stores/funnelStore'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'

// ─── Fila de producto ─────────────────────────────────────────────────────────

function ProductRow({ product }: { product: Product }) {
  const updateProduct = useFunnelStore(s => s.updateProduct)
  const deleteProduct = useFunnelStore(s => s.deleteProduct)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(product.name)
  const [price, setPrice] = useState(String(product.price))
  const [desc, setDesc] = useState(product.description ?? '')

  const save = () => {
    const p = parseFloat(price)
    updateProduct(product.id, {
      name: name.trim() || product.name,
      price: isNaN(p) ? product.price : p,
      description: desc.trim() || undefined,
    })
    setEditing(false)
  }

  const cancel = () => {
    setName(product.name)
    setPrice(String(product.price))
    setDesc(product.description ?? '')
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl p-3 space-y-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre del producto"
          className="funnel-input text-[12px] w-full"
          autoFocus
        />
        <div className="flex items-center gap-1">
          <span className="text-[12px] text-slate-500 flex-shrink-0">$</span>
          <input
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="Precio"
            min={0}
            step={1}
            className="funnel-input text-[12px] flex-1 text-right font-mono"
          />
        </div>
        <input
          type="text"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Descripción (opcional)"
          className="funnel-input text-[12px] w-full"
        />
        <div className="flex gap-2 pt-1">
          <button
            onClick={save}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 text-white text-[11px] font-semibold hover:bg-orange-500 transition-colors"
          >
            <Check size={11} />
            Guardar
          </button>
          <button
            onClick={cancel}
            className="px-3 py-1.5 rounded-lg text-slate-400 text-[11px] hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl px-3 py-2.5 group hover:border-[#3a3a3a] transition-colors">
      <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Package size={13} className="text-orange-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-slate-200 truncate">{product.name}</p>
        {product.description && (
          <p className="text-[11px] text-slate-500 truncate mt-0.5">{product.description}</p>
        )}
        <p className="text-[13px] font-bold text-emerald-400 font-mono mt-0.5">
          ${product.price.toLocaleString('es', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </p>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
          title="Editar"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={() => deleteProduct(product.id)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Eliminar"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

// ─── Formulario para nuevo producto ──────────────────────────────────────────

function NewProductForm({ onDone }: { onDone: () => void }) {
  const addProduct = useFunnelStore(s => s.addProduct)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [desc, setDesc] = useState('')

  const submit = () => {
    const trimmed = name.trim()
    const p = parseFloat(price)
    if (!trimmed || isNaN(p)) return
    addProduct(trimmed, p, desc.trim() || undefined)
    onDone()
  }

  return (
    <div className="bg-[#1c1c1c] border border-orange-500/30 rounded-xl p-3 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Nuevo producto</p>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nombre del producto *"
        className="funnel-input text-[12px] w-full"
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onDone() }}
      />
      <div className="flex items-center gap-1">
        <span className="text-[12px] text-slate-500 flex-shrink-0">$</span>
        <input
          type="number"
          value={price}
          onChange={e => setPrice(e.target.value)}
          placeholder="Precio *"
          min={0}
          step={1}
          className="funnel-input text-[12px] flex-1 text-right font-mono"
          onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onDone() }}
        />
      </div>
      <input
        type="text"
        value={desc}
        onChange={e => setDesc(e.target.value)}
        placeholder="Descripción (opcional)"
        className="funnel-input text-[12px] w-full"
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onDone() }}
      />
      <div className="flex gap-2 pt-1">
        <button
          onClick={submit}
          disabled={!name.trim() || !price}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors',
            'bg-orange-600 text-white hover:bg-orange-500',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <Plus size={11} />
          Agregar
        </button>
        <button
          onClick={onDone}
          className="px-3 py-1.5 rounded-lg text-slate-400 text-[11px] hover:bg-white/5 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── Modal principal ──────────────────────────────────────────────────────────

export default function ProductsModal() {
  const isOpen = useFunnelStore(s => s.isProductsOpen)
  const toggleProducts = useFunnelStore(s => s.toggleProducts)
  const products = useFunnelStore(s => s.products)
  const [showNew, setShowNew] = useState(false)

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => toggleProducts(false)}
      />

      {/* Panel */}
      <aside
        className="fixed top-14 right-4 w-80 max-h-[calc(100vh-80px)] flex flex-col z-50 animate-fade-in"
        style={{
          backgroundColor: '#141414',
          border: '1px solid #2e2e2e',
          borderRadius: '14px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#252525] flex-shrink-0">
          <div className="w-6 h-6 rounded-md bg-orange-500/15 flex items-center justify-center">
            <Package size={13} className="text-orange-400" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-slate-100">Mis Productos</p>
            <p className="text-[10px] text-slate-500">{products.length} producto{products.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => toggleProducts(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ minHeight: 0 }}>
          {products.length === 0 && !showNew && (
            <div className="text-center py-8">
              <Package size={28} className="text-slate-700 mx-auto mb-2" />
              <p className="text-[12px] text-slate-500">Sin productos</p>
              <p className="text-[11px] text-slate-600 mt-1">Agrega tu primer producto para vincularlo a nodos de venta</p>
            </div>
          )}

          {products.map(p => (
            <ProductRow key={p.id} product={p} />
          ))}

          {showNew && (
            <NewProductForm onDone={() => setShowNew(false)} />
          )}
        </div>

        {/* Footer */}
        {!showNew && (
          <div className="px-3 pb-3 flex-shrink-0">
            <button
              onClick={() => setShowNew(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[#3a3a3a] text-slate-500 text-[12px] hover:border-orange-500/40 hover:text-orange-400 transition-colors"
            >
              <Plus size={13} />
              Agregar producto
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
