import React, {
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { TgglClient } from 'tggl-client'

type Context = {
  client: TgglClient
  setContext: (context: Record<string, any>) => void
  updateContext: (context: Record<string, any>) => void
  getLoading: () => boolean
  getError: () => any
  onChange: (callback: () => void) => void
  trackFlagEvaluation: (slug: string) => void
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const TgglContext = React.createContext<Context>({})

let counter = 0

export const useTggl = () => useContext(TgglContext)

let amplitude: { track: (name: string, properties: any) => void } | null = null

try {
  amplitude = require('@amplitude/analytics-browser')
} catch (e) {
  // ignore
}

const defaultOnFlagEvaluation = (opts: {
  slug: string
  active: boolean
  value: unknown
}) => {
  if (amplitude) {
    amplitude.track('[Tggl] Flag evaluated', opts)
  }
}

export const TgglProvider: FC<{
  client: TgglClient
  children: any
  initialContext?: Record<string, any>
  onFlagEvaluation?: (opts: {
    slug: string
    active: boolean
    value: unknown
  }) => void
}> = ({
  children,
  client,
  initialContext = {},
  onFlagEvaluation = defaultOnFlagEvaluation,
}) => {
  const ref = useRef({
    context: initialContext,
    loading: 0,
    loadedOnce: false,
    error: null as any,
    onChange: new Map<string, () => void>(),
    onFlagEvaluation,
  })

  ref.current.onFlagEvaluation = onFlagEvaluation

  const setContext = useCallback(
    (context: Record<string, any>) => {
      ref.current.context = context
      ref.current.loading++
      ref.current.loadedOnce = true
      ref.current.error = null
      for (const callback of ref.current.onChange.values()) {
        callback()
      }
      client
        .setContext(context)
        .catch((error) => {
          ref.current.error = error
        })
        .then(() => {
          ref.current.loading--
          for (const callback of ref.current.onChange.values()) {
            callback()
          }
        })
    },
    [client]
  )

  const value = useMemo<Context>(
    () => ({
      client,
      setContext,
      updateContext: (context) =>
        setContext({ ...ref.current.context, ...context }),
      getLoading: () => ref.current.loading > 0 && !ref.current.loadedOnce,
      getError: () => ref.current.error,
      onChange: (callback) => {
        const key = String(counter++)
        ref.current.onChange.set(key, callback)
        return () => ref.current.onChange.delete(key)
      },
      trackFlagEvaluation: (slug) =>
        ref.current.onFlagEvaluation({
          slug,
          active: client.isActive(slug),
          value: client.get(slug, null),
        }),
    }),
    [client, setContext]
  )

  useEffect(() => {
    setContext(initialContext)
    // We do not want to trigger this effect everytime the initialContext changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setContext])

  return <TgglContext.Provider value={value}>{children}</TgglContext.Provider>
}
