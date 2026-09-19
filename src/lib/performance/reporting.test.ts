import { afterEach, describe, expect, it, vi } from "vitest";

import {
  configurePerformanceReporter,
  reportWebVital,
  type WebVitalMetric,
} from "./reporting";

const restoreCallbacks: Array<() => void> = [];

const metric: WebVitalMetric = {
  delta: 120,
  id: "v4-123",
  name: "LCP",
  navigationType: "navigate",
  rating: "good",
  value: 1_850,
};

afterEach(() => {
  restoreCallbacks
    .splice(0)
    .reverse()
    .forEach((restore) => restore());
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("reportWebVital", () => {
  it("sends a serializable metric through the configured adapter", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-19T08:30:00.000Z"));
    const capture = vi.fn();
    restoreCallbacks.push(
      configurePerformanceReporter({ reportWebVital: capture }),
    );

    await reportWebVital(metric);

    expect(capture).toHaveBeenCalledWith({
      metric,
      timestamp: "2026-09-19T08:30:00.000Z",
    });
    expect(capture.mock.calls[0]?.[0].metric).not.toBe(metric);
  });

  it("restores the previous adapter without replacing a newer one", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const restoreFirst = configurePerformanceReporter({
      reportWebVital: first,
    });
    const restoreSecond = configurePerformanceReporter({
      reportWebVital: second,
    });
    restoreCallbacks.push(restoreFirst, restoreSecond);

    restoreFirst();
    await reportWebVital(metric);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it("contains synchronous and asynchronous adapter failures", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    restoreCallbacks.push(
      configurePerformanceReporter({
        reportWebVital: async () => {
          throw new Error("Analytics unavailable");
        },
      }),
    );

    await expect(reportWebVital(metric)).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      "Performance reporter failed",
      expect.objectContaining({ message: "Analytics unavailable" }),
    );
  });
});
