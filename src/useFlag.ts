import { useEffect, useRef, useState } from 'react';
import { TgglFlagSlug, TgglFlagValue } from 'tggl-client';
import { useTggl } from './useTggl.js';

function useFlag<
  TSlug extends TgglFlagSlug,
  TDefaultValue = TgglFlagValue<TSlug>,
>(
  slug: TSlug,
  defaultValue: TDefaultValue
): TgglFlagValue<TSlug> | TDefaultValue {
  const { client } = useTggl();
  const [value, setValue] = useState(() => client.get(slug, defaultValue));
  const ref = useRef({
    firstRender: true,
    defaultValue,
  });
  ref.current.defaultValue = defaultValue;

  useEffect(() => {
    if (ref.current.firstRender) {
      ref.current.firstRender = false;
    } else {
      setValue(client.get(slug, ref.current.defaultValue));
    }
    return client.onFlagChange(slug, () => {
      setValue(client.get(slug, ref.current.defaultValue));
    });
  }, [client, slug]);

  return value;
}

export { useFlag };
