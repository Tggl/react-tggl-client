import { useTggl } from './TgglProvider'
import { useEffect, useRef, useState } from 'react'

function useFlag<T>(slug: string): {
  readonly active: boolean
  readonly value: T | undefined
  readonly loading: boolean
  readonly error: any
}
function useFlag<T>(
  slug: string,
  defaultValue: T
): {
  readonly active: boolean
  readonly value: T
  readonly loading: boolean
  readonly error: any
}
function useFlag<T>(
  slug: string,
  defaultValue?: T
): {
  readonly active: boolean
  readonly value: T
  readonly loading: boolean
  readonly error: any
} {
  const { client, getLoading, getError, onChange } = useTggl()
  const ref = useRef({
    listeningToLoadingOrError: false,
    listeningToValue: false,
    active: client.isActive(slug),
    value: client.get(slug, defaultValue) as T,
    loading: getLoading(),
    error: getError(),
  })
  const [value, setValue] = useState({
    active: ref.current.active,
    get value() {
      ref.current.listeningToValue = true
      return ref.current.value
    },
    get loading() {
      ref.current.listeningToLoadingOrError = true
      return getLoading()
    },
    get error() {
      ref.current.listeningToLoadingOrError = true
      return getError()
    },
  })

  useEffect(
    () =>
      onChange(() => {
        const oldValues = { ...ref.current }
        ref.current.active = client.isActive(slug)
        ref.current.value = client.get(slug, defaultValue) as T
        ref.current.loading = getLoading()
        ref.current.error = getError()

        if (
          oldValues.active !== ref.current.active ||
          (oldValues.value !== ref.current.value &&
            ref.current.listeningToValue) ||
          (oldValues.loading !== ref.current.loading &&
            ref.current.listeningToLoadingOrError) ||
          (oldValues.error !== ref.current.error &&
            ref.current.listeningToLoadingOrError)
        ) {
          setValue({
            active: ref.current.active,
            get value() {
              ref.current.listeningToValue = true
              return ref.current.value
            },
            get loading() {
              ref.current.listeningToLoadingOrError = true
              return getLoading()
            },
            get error() {
              ref.current.listeningToLoadingOrError = true
              return getError()
            },
          })
        }
      }),
    [client, defaultValue, getError, getLoading, onChange, slug]
  )

  return value
}

export { useFlag }
