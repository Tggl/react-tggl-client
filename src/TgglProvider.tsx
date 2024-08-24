import React, {
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import {
  TgglClient,
  TgglContext,
  TgglFlagSlug,
  TgglFlagValue,
} from 'tggl-client'

export const PACKAGE_VERSION = '2.1.1'

type Context = {
  client: TgglClient
  setContext: (context: Partial<TgglContext>) => void
  updateContext: (context: Partial<TgglContext>) => void
  getLoading: () => boolean
  getError: () => any
  onChange: (callback: () => void) => void
  trackFlagEvaluation: (
    slug: TgglFlagSlug,
    options?: { defaultValue?: any; stack?: string }
  ) => void
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const TgglReactContext = React.createContext<Context>({})

let counter = 0

export const useTggl = () => useContext(TgglReactContext)

const amplitude:
  | { track: (name: string, properties: any) => void }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  | undefined = window.amplitude

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
  initialContext?: Partial<TgglContext>
  onFlagEvaluation?: <TSlug extends TgglFlagSlug>(opts: {
    slug: TSlug
    active: boolean
    value: TgglFlagValue<TSlug>
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
    reporting: client.detachReporting(),
  })

  ref.current.onFlagEvaluation = onFlagEvaluation

  if (ref.current.reporting) {
    ref.current.reporting.appPrefix = 'react-client:' + PACKAGE_VERSION
  }

  const setContext = useCallback(
    (context: Partial<TgglContext>) => {
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
      trackFlagEvaluation: (slug, options = {}) => {
        ref.current.reporting?.reportFlag(slug, {
          value: client.get(slug),
          active: client.isActive(slug),
          stack: options.stack,
          default: options.defaultValue,
        })
        ref.current.onFlagEvaluation({
          slug,
          active: client.isActive(slug),
          value: client.get(slug, null),
        })
      },
    }),
    [client, setContext]
  )

  useEffect(() => {
    setContext(initialContext)
    // We do not want to trigger this effect everytime the initialContext changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setContext])

  useEffect(() => {
    return client.onResultChange(() => {
      for (const callback of ref.current.onChange.values()) {
        callback()
      }
    })
  }, [client])

  return (
    <TgglReactContext.Provider value={value}>
      {children}
    </TgglReactContext.Provider>
  )
}
