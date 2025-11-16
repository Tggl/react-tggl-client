import { TgglClient, TgglContext } from 'tggl-client';
import React from 'react';

export type Context = {
  client: TgglClient;
  setContext: (context: Partial<TgglContext>) => void;
  updateContext: (context: Partial<TgglContext>) => void;
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const TgglReactContext = React.createContext<Context>({});
