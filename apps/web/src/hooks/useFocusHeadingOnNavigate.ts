import { useEffect, useRef, type RefObject } from "react"
import { useLocation } from "react-router"

export function useFocusHeadingOnNavigate(): RefObject<HTMLHeadingElement | null> {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    headingRef.current?.focus()
  }, [pathname])

  return headingRef
}
