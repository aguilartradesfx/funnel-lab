'use client'

import { createContext, useContext } from 'react'

export interface EditorScenario {
  id: string
  name: string
  is_default: boolean
}

export interface EditorUser {
  id: string
  email: string
  name: string
  avatarUrl: string
}

export interface EditorPlan {
  plan: string
  monthly_credits_total: number
  monthly_credits_used: number
  pack_credits: number
}

interface EditorContextType {
  user: EditorUser | null
  plan: EditorPlan | null
  scenarios: EditorScenario[]
  activeScenarioId: string | null
  onSwitchScenario: (id: string) => void
  onCreateScenario: (name: string) => Promise<void>
  onRenameScenario: (id: string, name: string) => Promise<void>
  onDeleteScenario: (id: string) => Promise<void>
}

export const EditorContext = createContext<EditorContextType>({
  user: null,
  plan: null,
  scenarios: [],
  activeScenarioId: null,
  onSwitchScenario: () => {},
  onCreateScenario: async () => {},
  onRenameScenario: async () => {},
  onDeleteScenario: async () => {},
})

export const useEditorContext = () => useContext(EditorContext)
