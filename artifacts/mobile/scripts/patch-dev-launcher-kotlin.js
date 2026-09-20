#!/usr/bin/env node
/**
 * Postinstall compatibility patch for expo-dev-launcher-gradle-plugin
 *
 * This script patches the expo-dev-launcher-gradle-plugin to use Kotlin 2.1.20
 * instead of 1.9.25 to resolve the Kotlin metadata version mismatch in Expo SDK 54.
 *
 * Root cause: expo-dev-launcher@5.0.35 (bundled with expo-dev-client@5.0.20)
 * hardcodes Kotlin 1.9.25, but Expo SDK 54's react-native@0.81.5 and
 * expo-modules-autolinking@3.0.27 use Kotlin 2.1.20. This causes a metadata
 * version mismatch during Gradle compilation:
 * "Incompatible classes were found in dependencies... metadata version is 2.1.0,
 * expected version is 1.9.0"
 *
 * This patch should be reassessed when expo-dev-client / expo-dev-launcher
 * versions are upgraded (e.g., to Expo SDK 55+ which may include 5.1.x).
 */

const fs = require('fs');
const path = require('path');

const EXPECTED_VERSION = '5.0.35';
const EXPECTED_ORIGINAL_LINE = 'kotlin("jvm") version "1.9.25"';
const PATCHED_LINE = 'kotlin("jvm") version "2.1.20"';

function findExpoDevLauncher() {
  try {
    // Resolve the package path dynamically
    const pkgPath = require.resolve('expo-dev-launcher/package.json', {
      paths: [path.join(__dirname, '..')]
    });
    return path.dirname(pkgPath);
  } catch (e) {
    // Fallback: try pnpm store structure
    const pnpmStore = path.join(__dirname, '..', '..', '..', 'node_modules', '.pnpm');
    if (fs.existsSync(pnpmStore)) {
      const entries = fs.readdirSync(pnpmStore);
      const match = entries.find(dir => dir.startsWith('expo-dev-launcher@') && dir.includes('expo@54'));
      if (match) {
        const candidate = path.join(pnpmStore, match, 'node_modules', 'expo-dev-launcher');
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      }
    }
    return null;
  }
}

function readVersion(packageJsonPath) {
  const content = fs.readFileSync(packageJsonPath, 'utf8');
  const pkg = JSON.parse(content);
  return pkg.version;
}

function main() {
  console.log('[patch-dev-launcher-kotlin] Starting compatibility patch...');

  // Step 1: Find expo-dev-launcher dynamically
  const launcherDir = findExpoDevLauncher();
  if (!launcherDir) {
    console.log('[patch-dev-launcher-kotlin] expo-dev-launcher not installed. Skipping patch.');
    return;
  }
  console.log(`[patch-dev-launcher-kotlin] Found expo-dev-launcher at: ${launcherDir}`);

  // Step 2: Verify version
  const packageJsonPath = path.join(launcherDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found at ${packageJsonPath}`);
  }
  const version = readVersion(packageJsonPath);
  console.log(`[patch-dev-launcher-kotlin] Installed version: ${version}`);

  if (version !== EXPECTED_VERSION) {
    throw new Error(
      `Version mismatch: expected ${EXPECTED_VERSION}, found ${version}. ` +
      `This patch is designed for expo-dev-launcher@${EXPECTED_VERSION}. ` +
      `If you upgraded expo-dev-launcher/expo-dev-client, please review compatibility.`
    );
  }

  // Step 3: Read the Gradle plugin build file
  const gradlePluginDir = path.join(launcherDir, 'expo-dev-launcher-gradle-plugin');
  const buildGradleKts = path.join(gradlePluginDir, 'build.gradle.kts');

  if (!fs.existsSync(buildGradleKts)) {
    throw new Error(`build.gradle.kts not found at ${buildGradleKts}`);
  }

  let content = fs.readFileSync(buildGradleKts, 'utf8');

  // Step 4: Check if already patched
  if (content.includes(PATCHED_LINE)) {
    console.log('[patch-dev-launcher-kotlin] Already patched to Kotlin 2.1.20. Skipping.');
    return;
  }

  // Step 5: Verify the exact original line exists
  if (!content.includes(EXPECTED_ORIGINAL_LINE)) {
    // Check if it's a different version
    const kotlinVersionMatch = content.match(/kotlin\("jvm"\)\s+version\s+"([^"]+)"/);
    if (kotlinVersionMatch) {
      throw new Error(
        `Unexpected Kotlin version in ${buildGradleKts}: found "${kotlinVersionMatch[1]}", ` +
        `expected "${EXPECTED_ORIGINAL_LINE.split('"')[1]}". ` +
        `This patch only supports expo-dev-launcher@${EXPECTED_VERSION}.`
      );
    } else {
      throw new Error(
        `Could not find Kotlin version declaration in ${buildGradleKts}. ` +
        `Expected line: ${EXPECTED_ORIGINAL_LINE}`
      );
    }
  }

  // Step 6: Apply the patch
  const newContent = content.replace(EXPECTED_ORIGINAL_LINE, PATCHED_LINE);

  if (newContent === content) {
    throw new Error('Patch did not change the file content');
  }

  fs.writeFileSync(buildGradleKts, newContent);
  console.log('[patch-dev-launcher-kotlin] Successfully patched Kotlin version to 2.1.20');
  console.log('[patch-dev-launcher-kotlin] Patch complete.');
}

try {
  main();
} catch (err) {
  console.error('[patch-dev-launcher-kotlin] ERROR:', err.message);
  process.exit(1);
}