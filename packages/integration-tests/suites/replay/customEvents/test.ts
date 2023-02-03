import { expect } from '@playwright/test';

import { sentryTest } from '../../../utils/fixtures';
import {
  expectedFCPPerformanceSpan,
  expectedFPPerformanceSpan,
  expectedLCPPerformanceSpan,
  expectedMemoryPerformanceSpan,
  expectedNavigationPerformanceSpan,
  getExpectedReplayEvent,
} from '../../../utils/replayEventTemplates';
import { getCustomRecordingEvents, getReplayEvent, waitForReplayRequest } from '../../../utils/replayHelpers';

sentryTest(
  'replay recording should contain default performance spans',
  async ({ getLocalTestPath, page, browserName }) => {
    // Replay bundles are es6 only and most performance entries are only available in chromium
    if ((process.env.PW_BUNDLE && process.env.PW_BUNDLE.startsWith('bundle_es5')) || browserName !== 'chromium') {
      sentryTest.skip();
    }

    const reqPromise0 = waitForReplayRequest(page, 0);
    const reqPromise1 = waitForReplayRequest(page, 1);

    await page.route('https://dsn.ingest.sentry.io/**/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'test-id' }),
      });
    });

    const url = await getLocalTestPath({ testDir: __dirname });

    await page.goto(url);
    const replayEvent0 = getReplayEvent(await reqPromise0);
    const { performanceSpans: performanceSpans0 } = getCustomRecordingEvents(await reqPromise0);

    expect(replayEvent0).toEqual(getExpectedReplayEvent({ segment_id: 0 }));

    await page.click('button');

    const replayEvent1 = getReplayEvent(await reqPromise1);
    const { performanceSpans: performanceSpans1 } = getCustomRecordingEvents(await reqPromise1);

    expect(replayEvent1).toEqual(
      getExpectedReplayEvent({ segment_id: 1, urls: [], replay_start_timestamp: undefined }),
    );

    // We can't guarantee the order of the performance spans, or in which of the two segments they are sent
    // So to avoid flakes, we collect them all and check that they are all there
    const collectedPerformanceSpans = [...performanceSpans0, ...performanceSpans1];

    expect(collectedPerformanceSpans).toEqual(
      expect.arrayContaining([
        expectedNavigationPerformanceSpan,
        expectedLCPPerformanceSpan,
        expectedFPPerformanceSpan,
        expectedFCPPerformanceSpan,
        expectedMemoryPerformanceSpan, // two memory spans - once per flush
        expectedMemoryPerformanceSpan,
      ]),
    );
  },
);