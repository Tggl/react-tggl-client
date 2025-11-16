import 'global-jsdom/register';
import { before, beforeEach, it } from 'node:test';
import assert from 'node:assert';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import fetchMock from 'fetch-mock';
import { TgglProvider } from './TgglProvider.js';
import { TgglClient } from 'tggl-client';
import { useFlag } from './useFlag.js';

before(() => {
  fetchMock.mockGlobal();
});

beforeEach(() => {
  fetchMock.clearHistory();
  fetchMock.removeRoutes();
  document.body.innerHTML = '';
});

it('value should be updated when flag value changes', async () => {
  fetchMock.post('https://api.tggl.io/flags', '{"flagA":42}', { repeat: 1 });
  fetchMock.post('https://api.tggl.io/flags', '{"flagA":"foo"}', { repeat: 1 });

  const client = new TgglClient({
    maxRetries: 0,
    reporting: false,
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TgglProvider client={client}>{children}</TgglProvider>
  );

  const { result } = renderHook(() => useFlag('flagA', 'my_default'), {
    wrapper,
  });

  assert.equal(result.current, 'my_default');

  await waitFor(() => {
    assert.equal(result.current, 42);
  });

  await client.refetch();

  await waitFor(() => {
    assert.equal(result.current, 'foo');
  });
});

it('value should not be updated when default value changes', async () => {
  fetchMock.post('https://api.tggl.io/flags', '{}');

  const client = new TgglClient({
    maxRetries: 0,
    reporting: false,
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TgglProvider client={client}>{children}</TgglProvider>
  );

  const { result, rerender } = renderHook(
    ({ defaultValue }) => useFlag('flagA', defaultValue),
    {
      wrapper,
      initialProps: { defaultValue: 'my_default' },
    }
  );

  assert.equal(result.current, 'my_default');

  rerender({ defaultValue: 'new_default' });

  assert.equal(result.current, 'my_default');
});

it('value should be updated when slug changes', async () => {
  fetchMock.post(
    'https://api.tggl.io/flags',
    '{"flagA":"valueA","flagB":"valueB"}'
  );

  const client = new TgglClient({
    maxRetries: 0,
    reporting: false,
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TgglProvider client={client}>{children}</TgglProvider>
  );

  const { result, rerender } = renderHook(
    ({ slug }) => useFlag(slug, 'my_default'),
    {
      wrapper,
      initialProps: { slug: 'flagA' },
    }
  );

  await waitFor(() => {
    assert.equal(result.current, 'valueA');
  });

  rerender({ slug: 'flagB' });
  assert.equal(result.current, 'valueB');

  rerender({ slug: 'flagC' });
  assert.equal(result.current, 'my_default');
});
