const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, '../..');

const config = getDefaultConfig(projectRoot);

const defaultWatchFolders = config.watchFolders || [];
const virtualStoreDir = path.resolve('C:/pnpm-virtual-store');
const extraWatchFolders = [projectRoot, workspaceRoot];
if (require('fs').existsSync(virtualStoreDir)) {
  extraWatchFolders.push(virtualStoreDir);
}

config.watchFolders = Array.from(new Set([...extraWatchFolders, ...defaultWatchFolders]));

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
  ...(require('fs').existsSync(virtualStoreDir) ? [virtualStoreDir] : []),
];

module.exports = config;
