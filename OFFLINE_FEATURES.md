# Offline Features Documentation

Your Quizzy web app now supports offline functionality! Users can continue using the app even when they don't have an internet connection.

## Features Added

### 1. Service Worker

- **Location**: `/public/sw.js`
- **Purpose**: Caches essential app resources for offline use
- **What it caches**:
  - App shell (HTML, JS bundles)
  - Quiz data files (English, German, Finnish)
  - Static assets

### 2. Offline Detection

- **Hook**: `/hooks/useOfflineDetection.ts`
- **Component**: `/components/OfflineIndicator.tsx`
- Real-time network status monitoring
- Visual indicator when offline (orange banner)
- Success message when connection is restored (green banner)

### 3. Progressive Web App (PWA) Support

- **Manifest**: `/public/manifest.json`
- App is installable on mobile and desktop devices
- Standalone mode for app-like experience
- Custom theme colors and icons

### 4. Persistent Storage

- Quiz data is already stored using AsyncStorage
- Works seamlessly across online/offline states
- User progress, scores, and settings are preserved

## How It Works

### First Visit (Online)

1. User visits the web app
2. Service worker registers and caches essential resources
3. Quiz data is stored in AsyncStorage
4. App is ready for offline use

### Subsequent Visits (Offline)

1. Service worker serves cached resources
2. App loads from cache instantly
3. User sees "Offline - Using cached data" indicator
4. All quizzes and features work normally
5. User progress is saved locally

### Back Online

1. App detects connection restoration
2. Shows "Back online" message
3. Service worker updates cache in background
4. New quiz updates can be fetched (if enabled)

## Testing Offline Functionality

### Using Chrome DevTools

1. Run `npm run web`
2. Open Chrome DevTools (F12)
3. Go to "Application" tab
4. Check "Service Workers" section to verify registration
5. Go to "Network" tab
6. Check "Offline" checkbox
7. Reload the page - app should still work!

### Using Network Settings

1. Run the web app
2. Disconnect from WiFi/Ethernet
3. Navigate through the app
4. Take quizzes and verify functionality
5. Reconnect to see "Back online" message

## Configuration

### Cache Strategy

The service worker uses a "Cache First, Network Fallback" strategy:

- Checks cache first for fast loading
- Falls back to network if resource not cached
- Caches new resources automatically

### Updating the Service Worker

When you deploy updates:

1. Increment version in `/public/sw.js` (change `CACHE_NAME`)
2. Service worker will automatically clean old caches
3. New resources will be cached on next visit

### Customizing Cached Resources

Edit the `PRECACHE_URLS` array in `/public/sw.js` to add/remove resources:

```javascript
const PRECACHE_URLS = [
  '/',
  '/index.html',
  // Add more URLs here
];
```

## User Experience

### Offline Indicator

- Appears at the top of the screen when offline
- Orange background: "Offline - Using cached data"
- Green background: "Back online" (disappears after 3 seconds)
- Smooth slide-in/out animation

### PWA Installation

Users can install the app:

- **Chrome (Desktop)**: Click install icon in address bar
- **Chrome (Mobile)**: "Add to Home Screen" option
- **Safari (iOS)**: Share → "Add to Home Screen"
- **Edge**: Click install icon in address bar

Once installed:

- App opens in standalone window (no browser UI)
- Appears in app drawer/home screen
- Faster loading times
- Full offline support

## Benefits

1. **Better User Experience**

   - Works without internet connection
   - Faster load times (served from cache)
   - No loading spinners for cached content

2. **Improved Accessibility**

   - Users in areas with poor connectivity can still learn
   - No data usage for repeat visits
   - Reliable performance

3. **Modern App Feel**
   - Installable on devices
   - Standalone app experience
   - Professional appearance

## Technical Details

### Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 11.3+)
- Opera: Full support

### Storage Limits

- Service Worker cache: ~50MB (varies by browser)
- AsyncStorage: ~5-10MB (sufficient for quiz data)

### Limitations

- Remote quiz updates require internet connection
- Text-to-speech may require online connection
- Initial visit must be online to cache resources

## Maintenance

### Monitoring Service Worker

Check the browser console for service worker logs:

- Registration status
- Cache operations
- Fetch events
- Errors

### Clearing Cache

Users can clear cache via:

- Browser settings
- DevTools → Application → Clear Storage
- App will re-cache on next visit
