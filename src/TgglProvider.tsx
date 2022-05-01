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
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const TgglContext = React.createContext<Context>({})

let counter = 0

export const useTggl = () => useContext(TgglContext)

export const TgglProvider: FC<{
  client: TgglClient
  children: any
  initialContext?: Record<string, any>
}> = ({ children, client, initialContext = {} }) => {
  const ref = useRef({
    context: initialContext,
    loading: false,
    error: null as any,
    onChange: new Map<string, () => void>(),
  })

  const setContext = useCallback(
    (context: Record<string, any>) => {
      ref.current.context = context
      ref.current.loading = true
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
          ref.current.loading = false
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
      getLoading: () => ref.current.loading,
      getError: () => ref.current.error,
      onChange: (callback) => {
        const key = String(counter++)
        ref.current.onChange.set(key, callback)
        return () => ref.current.onChange.delete(key)
      },
    }),
    [client, setContext]
  )

  useEffect(() => {
    setContext(initialContext)
  }, [initialContext, setContext])

  return <TgglContext.Provider value={value}>{children}</TgglContext.Provider>
}
