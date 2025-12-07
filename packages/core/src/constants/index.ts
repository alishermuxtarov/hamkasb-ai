// Shared constants
export const AGENT_IDS = [
  'librarian',
  'docflow',
  'kyc',
  'financier',
  'hr',
  'support',
  'marketer',
  'pr',
  'designer',
  'smm',
] as const

export const SUPPORTED_LANGUAGES = ['ru', 'uz', 'kaa', 'en'] as const

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

