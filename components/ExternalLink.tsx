import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Platform } from 'react-native';

export function ExternalLink(
  props: Omit<React.ComponentProps<typeof Link>, 'href'> & { href: string },
) {
  // External URLs are not in the typed-route union. A cast rather than
  // `@ts-expect-error`: expo-router writes `.expo/types/router.d.ts` when the
  // dev server runs, so without it `href` accepts a plain string and the
  // directive would be an unused-expect-error, which is itself a type error.
  // The cast is accepted either way, so this file typechecks in a fresh clone.
  const href = props.href as React.ComponentProps<typeof Link>['href'];

  return (
    <Link
      target="_blank"
      {...props}
      href={href}
      onPress={(e) => {
        if (Platform.OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          e.preventDefault();
          // Open the link in an in-app browser.
          WebBrowser.openBrowserAsync(props.href as string);
        }
      }}
    />
  );
}
