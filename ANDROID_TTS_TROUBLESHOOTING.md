# Android TTS Troubleshooting Guide

## Common Android Settings That Block TTS

### 1. **Chrome Mobile Data/Battery Saver Settings**
- **Chrome Settings > Site Settings > Sound**
  - Make sure "Sound" is allowed for your site
- **Chrome Settings > Privacy and Security > Site Settings > Additional Content Settings > Sound**
  - Ensure sound is not blocked globally

### 2. **Android System Sound Settings**
- **Settings > Sound > Media Volume**
  - Must be above 0% (even if phone is on silent, media volume affects TTS)
- **Settings > Accessibility > Text-to-Speech**
  - Check if TTS engine is installed and enabled
  - Try switching to "Google Text-to-Speech" if using Samsung TTS

### 3. **Chrome Permissions**
- **Chrome Settings > Site Settings > Microphone** (affects TTS on some devices)
- **Chrome Settings > Site Settings > Notifications**
- Clear Chrome cache and cookies for the site

### 4. **Android Battery Optimization**
- **Settings > Apps > Chrome > Battery > Battery Optimization**
  - Set to "Don't optimize" or "Unrestricted"
- **Settings > Device Care > Battery > Background App Limits**
  - Remove Chrome from sleeping/deep sleeping apps

### 5. **Developer Options (if enabled)**
- **Settings > Developer Options > Media > Disable USB Audio Routing**
- **Settings > Developer Options > Media > Audio Codec**
  - Try different codecs if available

## Testing Steps:

1. **First, test with the built-in TTS test component:**
   ```tsx
   // Add to your app temporarily
   import { TtsTestComponent } from '@/components/TtsTestComponent';
   // Then render it: <TtsTestComponent />
   ```

2. **Check browser console logs:**
   - Open Chrome DevTools on desktop
   - Connect Android device via USB
   - Enable USB Debugging
   - Use `chrome://inspect` to debug the mobile browser

3. **Test with simple HTML page:**
   ```html
   <!DOCTYPE html>
   <html>
   <body>
     <button onclick="testTTS()">Test TTS</button>
     <script>
       function testTTS() {
         const utterance = new SpeechSynthesisUtterance('Hello world');
         utterance.onstart = () => console.log('Started');
         utterance.onend = () => console.log('Ended');
         utterance.onerror = (e) => console.error('Error:', e);
         speechSynthesis.speak(utterance);
       }
     </script>
   </body>
   </html>
   ```

## Common Error Messages and Solutions:

### "not-allowed" Error
- **Solution:** Ensure user interaction triggered the TTS (button press, not automatic)
- **Check:** Chrome permissions for the site

### "interrupted" or "canceled" Error
- **Solution:** Usually recoverable - our hook now handles this
- **Check:** Multiple TTS calls happening simultaneously

### "network" Error
- **Solution:** TTS voices not downloaded
- **Fix:** Go to Android Settings > Accessibility > Text-to-Speech > Preferred Engine > Settings > Install Voice Data

### "synthesis-failed" Error
- **Solution:** Hardware audio issues or TTS engine problems
- **Fix:** Restart Chrome, clear cache, or restart device

### No voices available (voices.length === 0)
- **Solution:** Wait for voiceschanged event or force reload
- **Fix:** Our hook now handles this with retries

## Device-Specific Issues:

### Samsung Devices
- Samsung TTS engine sometimes conflicts with Chrome
- Switch to Google TTS in Android Settings

### Xiaomi/MIUI
- MIUI has aggressive background app management
- Add Chrome to "Auto-start" apps
- Disable "Battery Saver" for Chrome

### Huawei/EMUI
- Similar to MIUI, very aggressive power management
- Whitelist Chrome in power management settings

## Quick Debug Commands:

Open browser console and run:
```javascript
// Check if TTS is available
console.log('TTS Available:', 'speechSynthesis' in window);

// Get voices (may need to wait for voiceschanged event)
console.log('Voices:', speechSynthesis.getVoices());

// Test simple utterance
const test = new SpeechSynthesisUtterance('test');
test.onstart = () => console.log('TTS Started');
test.onend = () => console.log('TTS Ended');
test.onerror = (e) => console.error('TTS Error:', e);
speechSynthesis.speak(test);
```

## If Nothing Works:

1. **Test in Chrome Incognito mode** (rules out extensions/cache issues)
2. **Test in different browser** (Samsung Internet, Firefox, etc.)
3. **Test on different Android device** (rules out device-specific issues)
4. **Use Web Audio API fallback** (more complex but more reliable)
5. **Consider native app with Expo Speech** for better mobile support
