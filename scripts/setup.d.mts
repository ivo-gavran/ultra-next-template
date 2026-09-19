export type SetupPaths = {
  envExample: string;
  envLocal: string;
  package: string;
  readme: string;
  site: string;
};

export type SetupValues = {
  apiUrl: string;
  appUrl: string;
  defaultLocale: string;
  descriptionBs: string;
  descriptionEn: string;
  name: string;
  packageName: string;
  shortName: string;
};

export type SetupArgs = Partial<SetupValues> & {
  dryRun: boolean;
  help: boolean;
  yes: boolean;
};

export function toPackageName(value: string): string;
export function parseSetupArgs(args: string[]): SetupArgs;
export function readSetupDefaults(
  root: string,
  files?: SetupPaths,
): Promise<SetupValues>;
export function validateSetupValues(
  values: SetupValues,
  supportedLocales: string[],
): SetupValues;
export function applySetup(
  root: string,
  inputValues: SetupValues,
  options?: { dryRun?: boolean; paths?: SetupPaths },
): Promise<{ changed: string[]; values: SetupValues }>;
