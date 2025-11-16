import 'global-jsdom/register';
import { describe, it, beforeEach, before } from 'node:test';
import assert from 'node:assert';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import fetchMock from 'fetch-mock';
import { TgglProvider } from './TgglProvider.js';
import { TgglClient } from 'tggl-client';
import { useTggl } from './useTggl.js';

before(() => {
  fetchMock.mockGlobal();
});

beforeEach(() => {
  fetchMock.clearHistory();
  fetchMock.removeRoutes();
  document.body.innerHTML = '';
});

describe('useTggl', () => {
  it('should return client, setContext, and updateContext', async () => {
    fetchMock.post('https://api.tggl.io/flags', {});

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TgglProvider client={client}>{children}</TgglProvider>
    );

    const { result } = renderHook(() => useTggl(), { wrapper });

    assert.ok(result.current.client);
    assert.equal(typeof result.current.setContext, 'function');
    assert.equal(typeof result.current.updateContext, 'function');
  });

  it('should return the same client instance', async () => {
    fetchMock.post('https://api.tggl.io/flags', {});

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TgglProvider client={client}>{children}</TgglProvider>
    );

    const { result } = renderHook(() => useTggl(), { wrapper });

    assert.strictEqual(result.current.client, client);
  });

  it('ready should be false initially and true after fetch', async () => {
    fetchMock.post('https://api.tggl.io/flags', {});

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TgglProvider client={client}>{children}</TgglProvider>
    );

    const { result } = renderHook(() => useTggl(), { wrapper });

    assert.equal(result.current.ready, false);

    await waitFor(() => {
      assert.equal(result.current.ready, true);
    });
  });

  it('ready should be true if client is already ready', async () => {
    fetchMock.post('https://api.tggl.io/flags', {});

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    await client.waitReady();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TgglProvider client={client}>{children}</TgglProvider>
    );

    const { result } = renderHook(() => useTggl(), { wrapper });

    assert.equal(result.current.ready, true);
  });

  it('error should be null initially and set on fetch error', async () => {
    fetchMock.post('https://api.tggl.io/flags', 500);

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TgglProvider client={client}>{children}</TgglProvider>
    );

    const { result } = renderHook(() => useTggl(), { wrapper });

    assert.equal(result.current.error, null);

    await waitFor(() => {
      assert.ok(result.current.error instanceof Error);
    });
  });

  it('error should be set if client already has an error', async () => {
    fetchMock.post('https://api.tggl.io/flags', 500);

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    await client.waitReady();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TgglProvider client={client}>{children}</TgglProvider>
    );

    const { result } = renderHook(() => useTggl(), { wrapper });

    assert.ok(result.current.error instanceof Error);
  });

  it('error should be cleared after successful fetch', async () => {
    fetchMock.post('https://api.tggl.io/flags', 500, { repeat: 1 });
    fetchMock.post('https://api.tggl.io/flags', {}, { repeat: 1 });

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TgglProvider client={client}>{children}</TgglProvider>
    );

    const { result } = renderHook(() => useTggl(), { wrapper });

    assert.equal(result.current.error, null);

    await waitFor(() => {
      assert.ok(result.current.error instanceof Error);
    });

    await client.refetch();

    await waitFor(() => {
      assert.equal(result.current.error, null);
    });
  });

  it('setContext should update the client context', async () => {
    fetchMock.post('https://api.tggl.io/flags', {});

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    await client.waitReady();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TgglProvider client={client}>{children}</TgglProvider>
    );

    const { result } = renderHook(() => useTggl(), { wrapper });

    result.current.setContext({ userId: '123' });

    await waitFor(() => {
      assert.deepStrictEqual(client.getContext(), { userId: '123' });
    });
  });

  it('updateContext should merge with existing context', async () => {
    fetchMock.post('https://api.tggl.io/flags', {});

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    await client.setContext({ userId: '123', role: 'admin' });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TgglProvider client={client}>{children}</TgglProvider>
    );

    const { result } = renderHook(() => useTggl(), { wrapper });

    result.current.updateContext({ email: 'test@example.com' });

    await waitFor(() => {
      assert.deepStrictEqual(client.getContext(), {
        userId: '123',
        role: 'admin',
        email: 'test@example.com',
      });
    });
  });

  it('should not trigger re-render if ready is not accessed', async () => {
    fetchMock.post('https://api.tggl.io/flags', {});

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TgglProvider client={client}>{children}</TgglProvider>
    );

    let renderCount = 0;

    renderHook(
      () => {
        renderCount++;
        const tggl = useTggl();
        // Don't access error property
        return { client: tggl.client };
      },
      { wrapper }
    );

    await client.waitReady();

    // Give time for potential re-render
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.equal(renderCount, 1);
  });

  it('should not trigger re-render if error is not accessed', async () => {
    fetchMock.post('https://api.tggl.io/flags', 500);

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TgglProvider client={client}>{children}</TgglProvider>
    );

    let renderCount = 0;

    renderHook(
      () => {
        renderCount++;
        const tggl = useTggl();
        // Don't access error property
        return { client: tggl.client };
      },
      { wrapper }
    );

    await client.waitReady();

    // Give time for potential re-render
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.equal(renderCount, 1);
  });

  it('should trigger re-render when ready changes and is accessed', async () => {
    fetchMock.post('https://api.tggl.io/flags', {});

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TgglProvider client={client}>{children}</TgglProvider>
    );

    let renderCount = 0;

    const { result } = renderHook(
      () => {
        renderCount++;
        const tggl = useTggl();
        // Access ready property
        return { ready: tggl.ready };
      },
      { wrapper }
    );

    assert.equal(renderCount, 1);
    assert.equal(result.current.ready, false);

    await waitFor(() => {
      assert.equal(result.current.ready, true);
    });

    assert.equal(renderCount, 2);
  });

  it('should trigger re-render when error changes and is accessed', async () => {
    fetchMock.post('https://api.tggl.io/flags', 500);

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TgglProvider client={client}>{children}</TgglProvider>
    );

    let renderCount = 0;

    const { result } = renderHook(
      () => {
        renderCount++;
        const tggl = useTggl();
        // Access error property
        return { error: tggl.error };
      },
      { wrapper }
    );

    assert.equal(renderCount, 1);
    assert.equal(result.current.error, null);

    await waitFor(() => {
      assert.ok(result.current.error instanceof Error);
    });

    assert.equal(renderCount, 2);
  });
});
