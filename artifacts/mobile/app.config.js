export default ({ config }) => {
  const isReplit = !!process.env.REPLIT_DEV_DOMAIN;
  const origin = isReplit
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'http://localhost:8081';

  return {
    ...config,
    scheme: 'mobile',
    experiments: {
      ...config?.experiments,
      typedRoutes: true,
      reactCompiler: true,
      autolinkingModuleResolution: true
    },
    extra: {
      ...config?.extra,
      router: {
        origin
      },
      eas: {
        projectId: '7e7db897-28a3-40e1-be45-68f7fde70fdf'
      }
    }
  };
};