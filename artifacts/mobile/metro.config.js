const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, '../..');

const config = getDefaultConfig(projectRoot);

config.projectRoot = projectRoot;

const defaultWatchFolders = config.watchFolders || [];
const pnpmVirtualStore = path.resolve(workspaceRoot, 'node_modules/.pnpm');
const winVirtualStore = 'C:/pnpm-virtual-store';

const extraWatchFolders = [
  projectRoot,
  workspaceRoot,
  ...(fs.existsSync(pnpmVirtualStore) ? [pnpmVirtualStore] : []),
  ...(fs.existsSync(winVirtualStore) ? [winVirtualStore] : []),
];

config.watchFolders = Array.from(new Set([...extraWatchFolders, ...defaultWatchFolders]));

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
  ...(fs.existsSync(pnpmVirtualStore) ? [pnpmVirtualStore] : []),
  ...(fs.existsSync(winVirtualStore) ? [winVirtualStore] : []),
];

module.exports = config;
