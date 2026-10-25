// Learn more https://docs.expo.dev/guides/customizing-metro
const { withSentryConfig } = require('./artifacts/mobile/node_modules/@sentry/react-native/metro');
const config = require('./artifacts/mobile/metro.config.js');

module.exports = config;
