import { useContext, useEffect, useRef, useState } from 'react';
import { TgglReactContext } from './context.js';
import { TgglClient, TgglContext } from 'tggl-client';

export const useTggl = (): {
  client: TgglClient;
  setContext: (context: Partial<TgglContext>) => void;
  updateContext: (context: Partial<TgglContext>) => void;
  readonly ready: boolean;
  readonly error: Error | null;
} => {
  const { client, setContext, updateContext } = useContext(TgglReactContext);

  const ref = useRef({
    ready: client.isReady(),
    listenReady: false,
    error: client.getError(),
    listenError: false,
  });

  const [, rerender] = useState(0);

  useEffect(() => {
    if (!client.isReady()) {
      client.onReady(() => {
        ref.current.ready = true;

        if (ref.current.listenReady) {
          rerender((c) => c + 1);
        }
      });
    }
    client.onError((error) => {
      ref.current.error = error;

      if (ref.current.listenError) {
        rerender((c) => c + 1);
      }
    });
    client.onFetchSuccessful(() => {
      const wasError = ref.current.error !== null;
      ref.current.error = null;

      if (ref.current.listenError && wasError) {
        rerender((c) => c + 1);
      }
    });
  }, [client]);

  return {
    client,
    setContext,
    updateContext,
    get ready() {
      ref.current.listenReady = true;
      return ref.current.ready;
    },
    get error() {
      ref.current.listenError = true;
      return ref.current.error;
    },
  };
};
