import type { ConfigContext, ExpoConfig } from 'expo/config';

// app.json holds the config. This only adds the web base path when one is set, so the
// GitHub Pages build can be served from /five-by-five-tracker/ while local dev stays at /.
export default ({ config }: ConfigContext): ExpoConfig => {
  const baseUrl = process.env.EXPO_BASE_URL;
  return {
    ...(config as ExpoConfig),
    experiments: { ...config.experiments, ...(baseUrl ? { baseUrl } : {}) },
  };
};
