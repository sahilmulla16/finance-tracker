module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
    plugins: [
      // Explicitly register expo-router plugin because hasModule('expo-router') fails
      // when babel-preset-expo is loaded from the workspace root node_modules,
      // since expo-router only exists in artifacts/mobile/node_modules/
      require('babel-preset-expo/build/expo-router-plugin').expoRouterBabelPlugin,
    ],
  };
};
