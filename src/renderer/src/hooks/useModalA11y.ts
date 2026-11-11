import { useEffect, useRef } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Escape-to-close, initial focus, and a Tab/Shift+Tab focus trap for a modal
 * dialog. Attach the returned ref to the dialog's outer element (the one
 * carrying role="dialog").
 */
export function useModalA11y<T extends HTMLElement>(onClose: () => void): React.RefObject<T> {
  const containerRef = useRef<T>(null)

  useEffect(() => {
    containerRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const container = containerRef.current
      if (!container) return
      // Recomputed on every Tab press — some fields (e.g. time/recurrence)
      // enable or disable depending on other field values.
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return containerRef
}
