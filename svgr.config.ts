import type { Config } from "@svgr/core";

const config: Config = {
  typescript: true,
  icon: true,
  jsxRuntime: "automatic",
  expandProps: "end",
  titleProp: true,
  svgo: true,
  prettier: false,
};

export default config;
