import { configurePerformanceReporter } from "@/lib/performance/reporting";

if (process.env.NODE_ENV === "development") {
  configurePerformanceReporter({
    reportWebVital(report) {
      console.debug("Web Vital", report);
    },
  });
}
