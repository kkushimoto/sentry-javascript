import 'jsdom-worker';

import pako from 'pako';

import { BASE_TIMESTAMP } from '../..';
import { EventBufferProxy } from '../../../src/eventBuffer/EventBufferProxy';
import { createEventBuffer } from './../../../src/eventBuffer';

const TEST_EVENT = { data: {}, timestamp: BASE_TIMESTAMP, type: 3 };

describe('Unit | eventBuffer | EventBufferProxy', () => {
  let consoleErrorSpy: jest.SpyInstance<any>;

  beforeEach(() => {
    // Avoid logging errors to console
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('waits for the worker to be loaded when calling finish', async function () {
    const buffer = createEventBuffer({
      useCompression: true,
      recordingMode: 'session',
    }) as EventBufferProxy;

    expect(buffer).toBeInstanceOf(EventBufferProxy);

    buffer.addEvent(TEST_EVENT);
    buffer.addEvent(TEST_EVENT);

    const result = await buffer.finish();
    expect(result).toBeInstanceOf(Uint8Array);
    const restored = pako.inflate(result as Uint8Array, { to: 'string' });
    expect(restored).toEqual(JSON.stringify([TEST_EVENT, TEST_EVENT]));
  });

  it('keeps using simple buffer if worker cannot be loaded', async function () {
    const workerString = 'window.triggerBlaError();';
    const workerBlob = new Blob([workerString]);
    const workerUrl = URL.createObjectURL(workerBlob);
    const worker = new Worker(workerUrl);
    const buffer = new EventBufferProxy(worker, 'session');

    buffer.addEvent(TEST_EVENT);
    buffer.addEvent(TEST_EVENT);

    // Finish before the worker is loaded
    const result = await buffer.finish();
    expect(typeof result).toBe('string');
    expect(result).toEqual(JSON.stringify([TEST_EVENT, TEST_EVENT]));

    // Now actually finish loading the worker - which triggers an error
    await buffer.ensureWorkerIsLoaded();

    buffer.addEvent(TEST_EVENT);
    buffer.addEvent(TEST_EVENT);
    buffer.addEvent(TEST_EVENT);

    const result2 = await buffer.finish();
    expect(typeof result2).toBe('string');
    expect(result2).toEqual(JSON.stringify([TEST_EVENT, TEST_EVENT, TEST_EVENT]));
  });
});
