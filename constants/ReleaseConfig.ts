// Netlify site that hosts the built Android APK + release manifest.
// GitHub Actions publishes `latest.apk` and `latest.json` to
// `<RELEASE_BASE_URL>/releases/android/`.
export const RELEASE_BASE_URL = 'https://quizzy-2504.netlify.app';

// JSON manifest describing the newest available Android build.
export const RELEASE_MANIFEST_URL = `${RELEASE_BASE_URL}/releases/android/latest.json`;
