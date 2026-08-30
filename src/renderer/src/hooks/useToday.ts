// Keeps a "current day" value fresh so the header date and overdue/today logic
// roll over automatically at midnight and whenever the window regains focus.

import { useEffect, useState } from 'react'
import { isoDate } from '../lib/dates'

export function useToday(): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = (): void => {
      // Only bump state when the calendar day actually changed, to avoid
      // needless re-renders while the app sits idle.
      setNow((prev) => (isoDate(prev) === isoDate(new Date()) ? prev : new Date()))
    }

    // Check every 30s (cheap) plus on focus, so a left-open window rolls over.
    const timer = setInterval(tick, 30_000)
    window.addEventListener('focus', tick)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', tick)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  return now
}
