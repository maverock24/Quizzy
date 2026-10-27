// Type references that the project needs, kept in a tracked file on purpose.
//
// Expo normally writes these into `expo-env.d.ts` when the dev server starts,
// but that file is generated and gitignored, so a fresh clone (and CI) had no
// reference to `expo/types`. Typechecking then failed on six errors about the
// `className` prop that react-native-web adds, which made `tsc --noEmit` pass
// locally only because a dev server had run at some point.
/// <reference types="expo/types" />
