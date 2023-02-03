/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { expect } from '@playwright/test';
import { SDK_VERSION } from '@sentry/browser';
import type { ReplayEvent } from '@sentry/types';

const DEFAULT_REPLAY_EVENT = {
  type: 'replay_event',
  timestamp: expect.any(Number),
  error_ids: [],
  trace_ids: [],
  urls: [expect.stringContaining('/dist/index.html')],
  replay_id: expect.stringMatching(/\w{32}/),
  replay_start_timestamp: expect.any(Number),
  segment_id: 0,
  replay_type: 'session',
  event_id: expect.stringMatching(/\w{32}/),
  environment: 'production',
  sdk: {
    integrations: [
      'InboundFilters',
      'FunctionToString',
      'TryCatch',
      'Breadcrumbs',
      'GlobalHandlers',
      'LinkedErrors',
      'Dedupe',
      'HttpContext',
      'Replay',
    ],
    version: SDK_VERSION,
    name: 'sentry.javascript.browser',
  },
  sdkProcessingMetadata: {},
  request: {
    url: expect.stringContaining('/dist/index.html'),
    headers: {
      'User-Agent': expect.stringContaining(''),
    },
  },
  platform: 'javascript',
  contexts: { replay: { session_sample_rate: 1, error_sample_rate: 0 } },
};

/**
 * Creates a ReplayEvent object with the default values merged with the customExpectedReplayEvent.
 * This is useful for testing multi-segment replays to not repeat most of the properties that don't change
 * throughout the replay segments.
 *
 * Note: The benfit of this approach over expect.objectContaining is that,
 *       we'll catch if properties we expect to stay the same actually change.
 *
 * @param customExpectedReplayEvent overwrite the default values with custom values (e.g. segment_id)
 */
export function getExpectedReplayEvent(customExpectedReplayEvent: Partial<ReplayEvent> & Record<string, unknown> = {}) {
  return {
    ...DEFAULT_REPLAY_EVENT,
    ...customExpectedReplayEvent,
  };
}

/* This is how we expect different kinds of navigation performance span to look: */

export const expectedNavigationPerformanceSpan = {
  op: 'navigation.navigate',
  description: '',
  startTimestamp: expect.any(Number),
  endTimestamp: expect.any(Number),
  data: {
    duration: expect.any(Number),
    size: expect.any(Number),
  },
};

export const expectedMemoryPerformanceSpan = {
  op: 'memory',
  description: 'memory',
  startTimestamp: expect.any(Number),
  endTimestamp: expect.any(Number),
  data: {
    memory: {
      jsHeapSizeLimit: expect.any(Number),
      totalJSHeapSize: expect.any(Number),
      usedJSHeapSize: expect.any(Number),
    },
  },
};

export const expectedLCPPerformanceSpan = {
  op: 'largest-contentful-paint',
  description: 'largest-contentful-paint',
  startTimestamp: expect.any(Number),
  endTimestamp: expect.any(Number),
  data: {
    duration: expect.any(Number),
    nodeId: expect.any(Number),
    size: expect.any(Number),
  },
};

export const expectedFCPPerformanceSpan = {
  op: 'paint',
  description: 'first-contentful-paint',
  startTimestamp: expect.any(Number),
  endTimestamp: expect.any(Number),
};

export const expectedFPPerformanceSpan = {
  op: 'paint',
  description: 'first-paint',
  startTimestamp: expect.any(Number),
  endTimestamp: expect.any(Number),
};
