import { ExpoConfig, ConfigContext } from 'expo/config';
import * as dotenv from 'dotenv';
import path from 'path';

try {
  dotenv.config({ path: path.resolve(__dirname, '.env') });
} catch {
  // Ignore in environments where dotenv resolution is handled externally
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const isReplit = !!process.env.REPLIT_DEV_DOMAIN;
  const origin = isReplit
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'http://localhost:8081';

  return {
    ...config,
    name: config.name || 'Zeno',
    slug: 'mobile',
    owner: 'sahilpvt',
    version: config.version || '1.0.0',
    scheme: config.scheme || 'mobile',
    newArchEnabled: true,
    android: {
      ...config.android,
      package: 'com.sahilmulla.pocketflow',
      versionCode: 1,
    },
    updates: {
      url: 'https://u.expo.dev/7e7db897-28a3-40e1-be45-68f7fde70fdf',
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: '1.0.0',
    experiments: {
      ...config?.experiments,
      typedRoutes: true,
      reactCompiler: true,
      autolinkingModuleResolution: true,
    },
    extra: {
      ...config?.extra,
      router: {
        origin,
      },
      eas: {
        projectId: '7e7db897-28a3-40e1-be45-68f7fde70fdf',
      },
      posthogProjectToken: process.env.POSTHOG_PROJECT_TOKEN,
      posthogHost: process.env.POSTHOG_HOST,
    },
  };
};

