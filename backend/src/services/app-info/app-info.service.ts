import { readFileSync } from 'fs';
import { join } from 'path';

export type AppInfo = {
  apiVersion: string;
  environment: string;
  status: 'ok';
};

const DEFAULT_API_VERSION = '1.0.0';
const DEFAULT_ENVIRONMENT = 'development';

function getPackageVersion() {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
    ) as { version?: unknown };

    return typeof packageJson.version === 'string' && packageJson.version.trim()
      ? packageJson.version
      : DEFAULT_API_VERSION;
  } catch {
    return DEFAULT_API_VERSION;
  }
}

export function getAppInfo(): AppInfo {
  return {
    apiVersion: process.env.API_VERSION?.trim() || getPackageVersion(),
    environment: process.env.NODE_ENV?.trim() || DEFAULT_ENVIRONMENT,
    status: 'ok',
  };
}
