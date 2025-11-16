import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react';
import { TgglClient, TgglContext } from 'tggl-client';
import { Context, TgglReactContext } from './context.js';

export const PACKAGE_VERSION = '4.0.0';

const amplitude:
  | { track: (name: string, properties: unknown) => void }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  | undefined = typeof window !== 'undefined' ? window.amplitude : undefined;

const intercom:
  | ((event: 'update', attributes: Record<string, unknown>) => void)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  | undefined = typeof window !== 'undefined' ? window.Intercom : undefined;

const defaultOnFlagEvaluation = (opts: { slug: string; value: unknown }) => {
  if (amplitude) {
    amplitude.track('[Tggl] Flag evaluated', opts);
  }

  if (intercom) {
    intercom('update', { [opts.slug]: opts.value });
  }
};

export type TgglProviderProps = {
  client: TgglClient;
  children: any;
  onFlagEval?: (data: {
    value: unknown;
    default: unknown;
    slug: string;
  }) => void;
  onError?: (error: Error) => void;
  onFetchSuccessful?: () => void;
};

export const TgglProvider: FC<TgglProviderProps> = ({
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
  });

  ref.current.onFlagEval = onFlagEval;
  ref.current.onError = onError;
  ref.current.onFetchSuccessful = onFetchSuccessful;

  useEffect(() => {
    const u1 = client.onFlagEval((data) => ref.current.onFlagEval(data));
    const u2 = client.onError((error) => ref.current.onError?.(error));
    const u3 = client.onFetchSuccessful(() =>
      ref.current.onFetchSuccessful?.()
    );

    return () => {
      u1();
      u2();
      u3();
    };
  }, [client]);

  const setContext = useCallback(
    (context: Partial<TgglContext>) => client.setContext(context),
    [client]
  );
  const updateContext = useCallback(
    (context: Partial<TgglContext>) =>
      client.setContext({ ...client.getContext(), ...context }),
    [client]
  );

  const value = useMemo<Context>(
    () => ({
      client,
      setContext,
      updateContext,
    }),
    [client, setContext, updateContext]
  );

  return (
    <TgglReactContext.Provider value={value}>
      {children}
    </TgglReactContext.Provider>
  );
};
