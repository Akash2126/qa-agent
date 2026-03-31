import { useState, useEffect } from 'react'

/**
 * Debounce a value — useful for auto-run on paste in the editor.
 * @param {*} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default 1500ms)
 */
export function useDebounce(value, delay = 1500) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
