import { useTggl } from './TgglProvider'
import { useEffect, useRef, useState } from 'react'
import { TgglFlagSlug, TgglFlagValue } from 'tggl-client'

function useFlag<TSlug extends TgglFlagSlug>(
  slug: TSlug
): {
  readonly active: boolean
  readonly value: TgglFlagValue<TSlug> | undefined
  readonly loading: boolean
  readonly error: any
}
function useFlag<
  TSlug extends TgglFlagSlug,
  TDefaultValue = TgglFlagValue<TSlug>
>(
  slug: TSlug,
  defaultValue: TDefaultValue
): {
  readonly active: boolean
  readonly value: TgglFlagValue<TSlug> | TDefaultValue
  readonly loading: boolean
  readonly error: any
}
function useFlag<
  TSlug extends TgglFlagSlug,
  TDefaultValue = TgglFlagValue<TSlug>
>(
  slug: TSlug,
  defaultValue?: TDefaultValue
): {
  readonly active: boolean
  readonly value: TgglFlagValue<TSlug> | TDefaultValue | undefined
  readonly loading: boolean
  readonly error: any
} {
  const { client, getLoading, getError, onChange, trackFlagEvaluation } =
    useTggl()
  const ref = useRef({
    listeningToLoadingOrError: false,
    listeningToValue: false,
    active: client.isActive(slug),
    value: client.get(slug, defaultValue),
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

  useEffect(() => {
    if (!ref.current.loading && !ref.current.error) {
      trackFlagEvaluation(slug)
    }
  }, [slug, trackFlagEvaluation])

  useEffect(() => {
    return onChange(() => {
      const oldValues = { ...ref.current }
      ref.current.active = client.isActive(slug)
      ref.current.value = client.get(slug, defaultValue)
      ref.current.loading = getLoading()
      ref.current.error = getError()

      if (
        (oldValues.active !== ref.current.active ||
          (oldValues.value !== ref.current.value &&
            ref.current.listeningToValue)) &&
        !ref.current.loading &&
        !ref.current.error
      ) {
        trackFlagEvaluation(slug)
      }

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
    })
  }, [
    client,
    defaultValue,
    getError,
    getLoading,
    onChange,
    slug,
    trackFlagEvaluation,
  ])

  return value
}

export { useFlag }
