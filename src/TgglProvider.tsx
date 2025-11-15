import React, {
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { TgglClient, TgglContext } from 'tggl-client'

export const PACKAGE_VERSION = '4.0.0'

type Context = {
  client: TgglClient
  setContext: (context: Partial<TgglContext>) => void
  updateContext: (context: Partial<TgglContext>) => void
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const TgglReactContext = React.createContext<Context>({})

export const useTggl = () => {
  const { client, setContext, updateContext } = useContext(TgglReactContext)

  const ref = useRef({
    ready: client.isReady(),
    listenReady: false,
    error: client.getError(),
    listenError: false,
  })

  const [_, rerender] = useState(0)

  useEffect(() => {
    if (!client.isReady()) {
      client.onReady(() => {
        ref.current.ready = true

        if (ref.current.listenReady) {
          rerender((c) => c + 1)
        }
      })
    }
    client.onError((error) => {
      ref.current.error = error

      if (ref.current.listenError) {
        rerender((c) => c + 1)
      }
    })
    client.onFetchSuccessful(() => {
      const wasError = ref.current.error !== null
      ref.current.error = null

      if (ref.current.listenError && wasError) {
        rerender((c) => c + 1)
      }
    })
  }, [client])

  return {
    client,
    setContext,
    updateContext,
    get ready() {
      ref.current.listenReady = true
      return ref.current.ready
    },
    get error() {
      ref.current.listenError = true
      return ref.current.error
    },
  }
}

const amplitude:
  | { track: (name: string, properties: any) => void }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  | undefined = typeof window !== 'undefined' ? window.amplitude : undefined

const intercom:
  | ((event: 'update', attributes: Record<string, any>) => void)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  | undefined = typeof window !== 'undefined' ? window.Intercom : undefined

const defaultOnFlagEvaluation = (opts: { slug: string; value: unknown }) => {
  if (amplitude) {
    amplitude.track('[Tggl] Flag evaluated', opts)
  }

  if (intercom) {
    intercom('update', { [opts.slug]: opts.value })
  }
}

export const TgglProvider: FC<{
  client: TgglClient
  children: any
  onFlagEval?: (data: {
    value: unknown
    default: unknown
    slug: string
  }) => void
  onError?: (error: Error) => void
  onFetchSuccessful?: () => void
}> = ({
  children,
  client,
  onFlagEval = defaultOnFlagEvaluation,
  onError,
  onFetchSuccessful,
}) => {
  const ref = useRef({
    onFlagEval,
    onError,
    onFetchSuccessful,
  })

  ref.current.onFlagEval = onFlagEval
  ref.current.onError = onError
  ref.current.onFetchSuccessful = onFetchSuccessful

  useEffect(() => {
    const u1 = client.onFlagEval((data) => ref.current.onFlagEval(data))
    const u2 = client.onError((error) => ref.current.onError?.(error))
    const u3 = client.onFetchSuccessful(() => ref.current.onFetchSuccessful?.())

    return () => {
      u1()
      u2()
      u3()
    }
  }, [client])

  const setContext = useCallback(
    (context: Partial<TgglContext>) => client.setContext(context),
    [client]
  )
  const updateContext = useCallback(
    (context: Partial<TgglContext>) =>
      client.setContext({ ...client.getContext(), ...context }),
    [client]
  )

  const value = useMemo<Context>(
    () => ({
      client,
      setContext,
      updateContext,
    }),
    [client, setContext, updateContext]
  )

  return (
    <TgglReactContext.Provider value={value}>
      {children}
    </TgglReactContext.Provider>
  )
}
