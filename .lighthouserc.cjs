const { chromium } = require("@playwright/test");

module.exports = {
  ci: {
    collect: {
      chromePath: chromium.executablePath(),
      numberOfRuns: 3,
      startServerCommand: "pnpm start --hostname 127.0.0.1 --port 3200",
      startServerReadyPattern: "Ready",
      startServerReadyTimeout: 60_000,
      url: ["http://127.0.0.1:3200/en", "http://127.0.0.1:3200/en/projects"],
      settings: {
        chromeFlags: "--headless --no-sandbox --disable-gpu",
        onlyCategories: ["performance"],
        preset: "desktop",
      },
    },
    assert: {
      assertions: {
        "categories:performance": [
          "warn",
          { aggregationMethod: "median-run", minScore: 0.9 },
        ],
        "cumulative-layout-shift": [
          "error",
          { aggregationMethod: "median-run", maxNumericValue: 0.1 },
        ],
        "largest-contentful-paint": [
          "warn",
          { aggregationMethod: "median-run", maxNumericValue: 2_500 },
        ],
        "resource-summary:script:size": [
          "error",
          { aggregationMethod: "median-run", maxNumericValue: 420_000 },
        ],
        "resource-summary:total:size": [
          "error",
          { aggregationMethod: "median-run", maxNumericValue: 450_000 },
        ],
        "total-blocking-time": [
          "error",
          { aggregationMethod: "median-run", maxNumericValue: 300 },
        ],
      },
    },
    upload: {
      outputDir: ".lighthouseci/reports",
      target: "filesystem",
    },
  },
};
