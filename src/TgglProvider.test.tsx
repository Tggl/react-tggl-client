import 'global-jsdom/register';
import { describe, it, beforeEach, before, mock } from 'node:test';
import assert from 'node:assert';
import { render } from '@testing-library/react';
import React from 'react';
import fetchMock from 'fetch-mock';
import { TgglProvider } from './TgglProvider.js';
import { TgglClient } from 'tggl-client';

before(() => {
  fetchMock.mockGlobal();
});

beforeEach(() => {
  fetchMock.clearHistory();
  fetchMock.removeRoutes();
  document.body.innerHTML = '';
});

describe('onError', () => {
  it('not having onError should work', async () => {
    fetchMock.post('https://api.tggl.io/flags', 500);

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    render(<TgglProvider client={client}>Hello</TgglProvider>);

    await client.waitReady();
  });

  it('onError should call current function', async () => {
    fetchMock.post('https://api.tggl.io/flags', 500);

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    const callback1 = mock.fn();
    const callback2 = mock.fn();

    const { rerender } = render(
      <TgglProvider client={client} onError={callback1}>
        Hello
      </TgglProvider>
    );

    await client.waitReady();
    assert.equal(callback1.mock.callCount(), 1);

    rerender(
      <TgglProvider client={client} onError={callback2}>
        Hello
      </TgglProvider>
    );

    await client.refetch();
    assert.equal(callback1.mock.callCount(), 1);
    assert.equal(callback2.mock.callCount(), 1);
  });

  it('handles errors thrown in onError callback', async () => {
    fetchMock.post('https://api.tggl.io/flags', 500);

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    const errorCallback = mock.fn(() => {
      throw new Error('Error in callback');
    });

    render(
      <TgglProvider client={client} onError={errorCallback}>
        Hello
      </TgglProvider>
    );

    await client.waitReady();

    assert.equal(errorCallback.mock.callCount(), 1);
    assert.ok(document.body.textContent?.includes('Hello'));
  });

  it('handles rejected promises in onError callback', async () => {
    fetchMock.post('https://api.tggl.io/flags', 500);

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    const errorCallback = mock.fn(async () => {
      return Promise.reject(new Error('Async error in callback'));
    });

    render(
      <TgglProvider client={client} onError={errorCallback}>
        Hello
      </TgglProvider>
    );

    await client.waitReady();

    assert.equal(errorCallback.mock.callCount(), 1);
    assert.ok(document.body.textContent?.includes('Hello'));
  });
});

describe('onFetchSuccessful', () => {
  it('not having onFetchSuccessful should work', async () => {
    fetchMock.post('https://api.tggl.io/flags', {});

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    render(<TgglProvider client={client}>Hello</TgglProvider>);

    await client.waitReady();
  });

  it('onFetchSuccessful should be called on successful fetch', async () => {
    fetchMock.post('https://api.tggl.io/flags', '{}');

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    const callback = mock.fn();

    render(
      <TgglProvider client={client} onFetchSuccessful={callback}>
        Hello
      </TgglProvider>
    );

    await client.waitReady();
    assert.equal(callback.mock.callCount(), 1);
  });

  it('onFetchSuccessful should not be called on failed fetch', async () => {
    fetchMock.post('https://api.tggl.io/flags', 500);

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    const callback = mock.fn();

    render(
      <TgglProvider client={client} onFetchSuccessful={callback}>
        Hello
      </TgglProvider>
    );

    await client.waitReady();
    assert.equal(callback.mock.callCount(), 0);
  });

  it('onFetchSuccessful should call current function on re-render', async () => {
    fetchMock.post('https://api.tggl.io/flags', {});

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    const callback1 = mock.fn();
    const callback2 = mock.fn();

    const { rerender } = render(
      <TgglProvider client={client} onFetchSuccessful={callback1}>
        Hello
      </TgglProvider>
    );

    await client.waitReady();
    assert.equal(callback1.mock.callCount(), 1);

    rerender(
      <TgglProvider client={client} onFetchSuccessful={callback2}>
        Hello
      </TgglProvider>
    );

    await client.refetch();
    assert.equal(callback1.mock.callCount(), 1);
    assert.equal(callback2.mock.callCount(), 1);
  });

  it('handles errors thrown in onFetchSuccessful callback', async () => {
    fetchMock.post('https://api.tggl.io/flags', {});

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    const successCallback = mock.fn(() => {
      throw new Error('Error in callback');
    });

    render(
      <TgglProvider client={client} onFetchSuccessful={successCallback}>
        Hello
      </TgglProvider>
    );

    await client.waitReady();

    assert.equal(successCallback.mock.callCount(), 1);
    assert.ok(document.body.textContent?.includes('Hello'));
  });

  it('handles rejected promises in onFetchSuccessful callback', async () => {
    fetchMock.post('https://api.tggl.io/flags', {});

    const client = new TgglClient({
      maxRetries: 0,
      reporting: false,
    });

    const successCallback = mock.fn(async () => {
      return Promise.reject(new Error('Async error in callback'));
    });

    render(
      <TgglProvider client={client} onFetchSuccessful={successCallback}>
        Hello
      </TgglProvider>
    );

    await client.waitReady();

    assert.equal(successCallback.mock.callCount(), 1);
    assert.ok(document.body.textContent?.includes('Hello'));
  });
});
