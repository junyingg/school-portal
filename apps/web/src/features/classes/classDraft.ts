import { CLASS_LEVELS, type ClassLevel } from "@school-portal/contract"

const STORAGE_KEY = "school-portal:class-draft"
export const CLASS_DRAFT_MAX_AGE_MS = 60 * 60 * 1000

export interface ClassDraft {
  readonly level?: ClassLevel
  readonly name?: string
  readonly teacherEmail?: string
}

interface StoredDraft {
  readonly savedAt: number
  readonly values: ClassDraft
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function textValue(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined
}

function sanitizedDraft(value: unknown): ClassDraft | undefined {
  if (!isRecord(value)) {
    return undefined
  }
  const level = textValue(value["level"])
  const name = textValue(value["name"])
  const teacherEmail = textValue(value["teacherEmail"])
  const knownLevel =
    level !== undefined && (CLASS_LEVELS as readonly string[]).includes(level)
      ? (level as ClassLevel)
      : undefined
  const values: ClassDraft = {
    ...(knownLevel === undefined ? {} : { level: knownLevel }),
    ...(name === undefined ? {} : { name }),
    ...(teacherEmail === undefined ? {} : { teacherEmail }),
  }
  return Object.keys(values).length === 0 ? undefined : values
}

export function readClassDraft(now = Date.now()): ClassDraft | undefined {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      return undefined
    }
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || typeof parsed["savedAt"] !== "number") {
      clearClassDraft()
      return undefined
    }
    if (now - parsed["savedAt"] > CLASS_DRAFT_MAX_AGE_MS) {
      clearClassDraft()
      return undefined
    }
    return sanitizedDraft(parsed["values"])
  } catch {
    return undefined
  }
}

export function writeClassDraft(values: Record<string, unknown>, now = Date.now()): void {
  const sanitized = sanitizedDraft(values)
  if (sanitized === undefined) {
    clearClassDraft()
    return
  }
  const stored: StoredDraft = { savedAt: now, values: sanitized }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // Storage can be unavailable in private browsing; the form still works without a draft.
  }
}

export function clearClassDraft(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage failures.
  }
}
