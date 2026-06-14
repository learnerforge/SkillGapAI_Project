import { useState, useCallback, useRef, useEffect } from 'react'

interface UseAsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseAsyncReturn<T> extends UseAsyncState<T> {
  execute: (...args: unknown[]) => Promise<T | null>
  reset: () => void
}

export function useAsync<T>(
  asyncFn: (...args: unknown[]) => Promise<T>,
  immediate = false,
): UseAsyncReturn<T> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  })
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const execute = useCallback(
    async (...args: unknown[]) => {
      setState(s => ({ ...s, loading: true, error: null }))
      try {
        const result = await asyncFn(...args)
        if (mountedRef.current) {
          setState({ data: result, loading: false, error: null })
        }
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred'
        if (mountedRef.current) {
          setState({ data: null, loading: false, error: message })
        }
        return null
      }
    },
    [asyncFn],
  )

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return { ...state, execute, reset }
}

export function useFetch<T>(url: string, immediate = false) {
  return useAsync<T>(
    useCallback(async () => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      return res.json()
    }, [url]),
    immediate,
  )
}
