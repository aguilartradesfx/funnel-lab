'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Países más comunes en Latinoamérica + España primero, resto del mundo después
const COUNTRIES: { code: string; name: string; dialCode: string; flag: string }[] = [
  { code: 'CR', name: 'Costa Rica',     dialCode: '+506', flag: '🇨🇷' },
  { code: 'MX', name: 'México',         dialCode: '+52',  flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina',      dialCode: '+54',  flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia',       dialCode: '+57',  flag: '🇨🇴' },
  { code: 'CL', name: 'Chile',          dialCode: '+56',  flag: '🇨🇱' },
  { code: 'PE', name: 'Perú',           dialCode: '+51',  flag: '🇵🇪' },
  { code: 'EC', name: 'Ecuador',        dialCode: '+593', flag: '🇪🇨' },
  { code: 'VE', name: 'Venezuela',      dialCode: '+58',  flag: '🇻🇪' },
  { code: 'BO', name: 'Bolivia',        dialCode: '+591', flag: '🇧🇴' },
  { code: 'PY', name: 'Paraguay',       dialCode: '+595', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguay',        dialCode: '+598', flag: '🇺🇾' },
  { code: 'GT', name: 'Guatemala',      dialCode: '+502', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras',       dialCode: '+504', flag: '🇭🇳' },
  { code: 'SV', name: 'El Salvador',    dialCode: '+503', flag: '🇸🇻' },
  { code: 'NI', name: 'Nicaragua',      dialCode: '+505', flag: '🇳🇮' },
  { code: 'PA', name: 'Panamá',         dialCode: '+507', flag: '🇵🇦' },
  { code: 'DO', name: 'Rep. Dominicana',dialCode: '+1',   flag: '🇩🇴' },
  { code: 'CU', name: 'Cuba',           dialCode: '+53',  flag: '🇨🇺' },
  { code: 'PR', name: 'Puerto Rico',    dialCode: '+1',   flag: '🇵🇷' },
  { code: 'ES', name: 'España',         dialCode: '+34',  flag: '🇪🇸' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1',   flag: '🇺🇸' },
  { code: 'CA', name: 'Canadá',         dialCode: '+1',   flag: '🇨🇦' },
  { code: 'BR', name: 'Brasil',         dialCode: '+55',  flag: '🇧🇷' },
]

interface PhoneInputFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
}

export default function PhoneInputField({
  value,
  onChange,
  placeholder = '8888-1234',
  disabled = false,
  error = false,
}: PhoneInputFieldProps) {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]) // Costa Rica default
  const [localNumber, setLocalNumber] = useState('')
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sincronizar hacia afuera: dialCode + número limpio
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d\s\-().]/g, '')
    setLocalNumber(raw)
    const digits = raw.replace(/\D/g, '')
    onChange(digits ? `${selectedCountry.dialCode}${digits}` : '')
  }

  const handleCountrySelect = (country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country)
    const digits = localNumber.replace(/\D/g, '')
    onChange(digits ? `${country.dialCode}${digits}` : '')
    setOpen(false)
  }

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Inicializar desde value externo (ej. prellenado de Google)
  useEffect(() => {
    if (!value) return
    const found = COUNTRIES.find(c => value.startsWith(c.dialCode))
    if (found && found.dialCode !== '+1') {
      setSelectedCountry(found)
      setLocalNumber(value.slice(found.dialCode.length))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={dropdownRef} className="relative">
      <div
        className={cn(
          'flex rounded-xl border bg-[#0f0f0f] transition-colors overflow-hidden',
          error ? 'border-red-500/60' : 'border-[#2e2e2e]',
          !disabled && 'focus-within:border-orange-500'
        )}
      >
        {/* Selector de país */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(v => !v)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2.5 border-r border-[#2e2e2e]',
            'text-sm text-slate-200 bg-transparent shrink-0',
            'hover:bg-white/5 transition-colors disabled:opacity-50'
          )}
        >
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <span className="text-slate-400 text-xs">{selectedCountry.dialCode}</span>
          <ChevronDown size={13} className={cn('text-slate-500 transition-transform', open && 'rotate-180')} />
        </button>

        {/* Input número */}
        <input
          type="tel"
          value={localNumber}
          onChange={handleNumberChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex-1 px-3 py-2.5 bg-transparent text-slate-100 text-sm',
            'placeholder:text-slate-600 outline-none disabled:opacity-50'
          )}
        />
      </div>

      {/* Dropdown de países */}
      {open && (
        <div className={cn(
          'absolute z-50 mt-1 w-full max-h-56 overflow-y-auto',
          'bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl shadow-2xl',
          'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#3e3e3e]'
        )}>
          {COUNTRIES.map(country => (
            <button
              key={`${country.code}-${country.dialCode}`}
              type="button"
              onClick={() => handleCountrySelect(country)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-sm text-left',
                'hover:bg-white/5 transition-colors',
                selectedCountry.code === country.code
                  ? 'text-orange-400'
                  : 'text-slate-300'
              )}
            >
              <span className="text-base">{country.flag}</span>
              <span className="flex-1 truncate">{country.name}</span>
              <span className="text-slate-500 text-xs">{country.dialCode}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
