export default ({ config }) => {
  const isReplit = !!process.env.REPLIT_DEV_DOMAIN;
  const origin = isReplit
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'http://localhost:8081';

  return {
    ...config,
    name: 'Pocketflow Finance',
    slug: 'mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/pocketflow-icon.png',
    scheme: 'mobile',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/images/pocketflow-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    ios: {
      supportsTablet: false
    },
    android: {
      package: 'com.sahilmulla.pocketflow',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/images/pocketflow-icon.png',
        backgroundColor: '#ffffff'
      }
    },
    web: {
      favicon: './assets/images/icon.png'
    },
    plugins: [
      ['expo-router', { origin }],
      'expo-font',
      'expo-web-browser',
      'expo-dev-client'
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    }
  };
};