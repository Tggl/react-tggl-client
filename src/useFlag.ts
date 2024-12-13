import { useTggl } from './TgglProvider'
import { useEffect, useRef, useState } from 'react'
import { TgglFlagSlug, TgglFlagValue } from 'tggl-client'

function useFlag<
  TSlug extends TgglFlagSlug,
  TDefaultValue = TgglFlagValue<TSlug>
>(
  slug: TSlug,
  defaultValue: TDefaultValue
): {
  readonly value: TgglFlagValue<TSlug> | TDefaultValue
  readonly loading: boolean
  readonly error: any
} {
  const { client, getLoading, getError, onChange, trackFlagEvaluation } =
    useTggl()
  const ref = useRef({
    listeningToLoadingOrError: false,
    listeningToValue: false,
    value: client.get(slug, defaultValue),
    loading: getLoading(),
    error: getError(),
    defaultValue,
  })
  ref.current.defaultValue = defaultValue

  const [value, setValue] = useState({
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
      trackFlagEvaluation(slug, {
        defaultValue: ref.current.defaultValue,
      })
    }
  }, [slug, trackFlagEvaluation])

  useEffect(() => {
    return onChange(() => {
      const oldValues = { ...ref.current }
      ref.current.value = client.get(slug, defaultValue)
      ref.current.loading = getLoading()
      ref.current.error = getError()

      const valueChanged =
        JSON.stringify(oldValues.value) !== JSON.stringify(ref.current.value)

      if (
        valueChanged &&
        ref.current.listeningToValue &&
        !ref.current.loading &&
        !ref.current.error
      ) {
        trackFlagEvaluation(slug, { defaultValue })
      }

      if (
        (valueChanged && ref.current.listeningToValue) ||
        (oldValues.loading !== ref.current.loading &&
          ref.current.listeningToLoadingOrError) ||
        (oldValues.error !== ref.current.error &&
          ref.current.listeningToLoadingOrError)
      ) {
        setValue({
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
