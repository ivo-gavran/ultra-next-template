"use client";

import { useReportWebVitals } from "next/web-vitals";

import { reportWebVital } from "@/lib/performance/reporting";

export function WebVitals() {
  useReportWebVitals(reportWebVital);

  return null;
}
