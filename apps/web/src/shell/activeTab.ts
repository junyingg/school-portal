export type TabId = "classes" | "teachers"

const TAB_BY_FIRST_SEGMENT = new Map<string, TabId>([
  ["classes", "classes"],
  ["teachers", "teachers"],
])

export function activeTabFor(pathname: string): TabId | undefined {
  const firstSegment = pathname.split("/")[1] ?? ""
  return TAB_BY_FIRST_SEGMENT.get(firstSegment)
}
