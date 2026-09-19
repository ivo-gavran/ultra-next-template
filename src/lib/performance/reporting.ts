type Awaitable<T> = T | Promise<T>;

export type WebVitalRating = "good" | "needs-improvement" | "poor";

export type WebVitalMetric = {
  delta: number;
  id: string;
  name: string;
  navigationType: string;
  rating: WebVitalRating;
  value: number;
};

export type WebVitalReport = {
  metric: WebVitalMetric;
  timestamp: string;
};

export type PerformanceReporter = {
  reportWebVital: (report: WebVitalReport) => Awaitable<void>;
};

const noopReporter: PerformanceReporter = {
  reportWebVital() {},
};

let activeReporter = noopReporter;

function createSafeMetric(metric: WebVitalMetric): WebVitalMetric {
  return {
    delta: metric.delta,
    id: metric.id,
    name: metric.name,
    navigationType: metric.navigationType,
    rating: metric.rating,
    value: metric.value,
  };
}

export function configurePerformanceReporter(reporter: PerformanceReporter) {
  const previousReporter = activeReporter;
  activeReporter = reporter;

  return () => {
    if (activeReporter === reporter) activeReporter = previousReporter;
  };
}

export async function reportWebVital(metric: WebVitalMetric) {
  const report: WebVitalReport = {
    metric: createSafeMetric(metric),
    timestamp: new Date().toISOString(),
  };

  try {
    await activeReporter.reportWebVital(report);
  } catch (error) {
    console.error("Performance reporter failed", error);
  }
}
