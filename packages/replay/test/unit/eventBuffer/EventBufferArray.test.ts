import type { ReplayRecordingMode } from '@sentry/types';

import { createEventBuffer } from './../../../src/eventBuffer';
import { BASE_TIMESTAMP } from './../../index';

const TEST_EVENT = { data: {}, timestamp: BASE_TIMESTAMP, type: 3 };

describe('Unit | eventBuffer | EventBufferArray', () => {
  for (const recordingMode of ['session', 'error'] as ReplayRecordingMode[]) {
    it(`adds events to normal event buffer with recordingMode=${recordingMode}`, async function () {
      const buffer = createEventBuffer({ useCompression: false, keepLastCheckout: recordingMode === 'error' });

      buffer.addEvent(TEST_EVENT);
      buffer.addEvent(TEST_EVENT);

      const result = await buffer.finish();

      expect(result).toEqual(JSON.stringify([TEST_EVENT, TEST_EVENT]));
    });

    it(`adds checkout event to normal event buffer with recordingMode=${recordingMode}`, async function () {
      const buffer = createEventBuffer({ useCompression: false, keepLastCheckout: recordingMode === 'error' });

      buffer.addEvent(TEST_EVENT);
      buffer.addEvent(TEST_EVENT);
      buffer.addEvent(TEST_EVENT);

      // Checkout triggers clear
      buffer.clear();
      buffer.addEvent(TEST_EVENT, true);
      buffer.addEvent(TEST_EVENT);
      const result = await buffer.finish();
      buffer.addEvent(TEST_EVENT);

      expect(result).toEqual(JSON.stringify([TEST_EVENT, TEST_EVENT]));
    });

    it(`calling \`finish()\` multiple times does not result in duplicated events with recordingMode=${recordingMode}`, async function () {
      const buffer = createEventBuffer({ useCompression: false, keepLastCheckout: recordingMode === 'error' });

      buffer.addEvent(TEST_EVENT);

      const promise1 = buffer.finish();
      const promise2 = buffer.finish();

      const result1 = (await promise1) as Uint8Array;
      const result2 = (await promise2) as Uint8Array;

      expect(result1).toEqual(JSON.stringify([TEST_EVENT]));
      expect(result2).toEqual(JSON.stringify([]));
    });
  }
});
