/**
 * Android APK update support.
 *
 * Fetches the release manifest (`latest.json`) that GitHub Actions publishes
 * to the Netlify site, compares the remote versionCode against the installed
 * build, and can download + launch the Android package installer for a new APK.
 */

import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';
import {
  RELEASE_BASE_URL,
  RELEASE_MANIFEST_URL,
} from '../constants/ReleaseConfig';

export type AndroidReleaseInfo = {
  version: string;
  versionCode: number;
  versionName: string;
  buildType: 'debug' | 'release';
  fileName: string;
  url: string;
  sizeBytes: number;
  sha256: string;
  publishedAt: string;
  commitSha: string;
  commitUrl: string;
};

export function isAndroidNative(): boolean {
  return Platform.OS === 'android';
}

/** Expand a relative release path against the configured Netlify base URL. */
export function resolveReleaseUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${RELEASE_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** The versionCode of the currently installed build (0 if unknown). */
export function getInstalledVersionCode(): number {
  const raw = Application.nativeBuildVersion;
  if (!raw) return 0;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Fetch the latest Android release manifest. Returns null if the manifest
 * does not exist or the request fails (so the settings screen can degrade
 * gracefully).
 */
export async function fetchLatestRelease(): Promise<AndroidReleaseInfo | null> {
  try {
    const url = `${RELEASE_MANIFEST_URL}?ts=${Date.now()}`;
    const resp = await fetch(url, { cache: 'no-store' });
    if (resp.status === 404) return null;
    if (!resp.ok) {
      throw new Error(`Unable to load release info (${resp.status})`);
    }
    const release = (await resp.json()) as AndroidReleaseInfo;
    return { ...release, url: resolveReleaseUrl(release.url) };
  } catch {
    return null;
  }
}

/** True when a remote release is a newer build than the installed one. */
export function isNewerRelease(release: AndroidReleaseInfo): boolean {
  return release.versionCode > getInstalledVersionCode();
}

/**
 * Download the release APK to the app cache and hand it to the Android
 * package installer. Uses a `content://` URI via a FileProvider so the
 * installer can open it on Android 7+ (avoids FileUriExposedException).
 */
export async function installAndroidRelease(
  release: AndroidReleaseInfo,
): Promise<void> {
  if (!isAndroidNative()) {
    throw new Error('APK install is only available on Android.');
  }

  const cacheDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!cacheDir) {
    throw new Error('No writable storage directory available.');
  }

  const localUri = `${cacheDir}update.apk`;

  const download = await FileSystem.downloadAsync(release.url, localUri);
  if (download.status !== 200) {
    throw new Error(`APK download failed (HTTP ${download.status}).`);
  }

  // content:// URI that the package installer can read.
  const contentUri = await FileSystem.getContentUriAsync(localUri);

  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: contentUri,
    type: 'application/vnd.android.package-archive',
    // FLAG_ACTIVITY_NEW_TASK = 0x10000000
    flags: 0x10000000,
  });
}
