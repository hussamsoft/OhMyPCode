/**
 * Setup for the `browser` vitest project only. It intentionally does not share
 * `vitest.setup.ts` with the `unit` project — that file assumes a jsdom-style
 * synthetic `window` and mocks native-only modules the browser project never
 * touches — so this stays a minimal, browser-specific shim.
 *
 * `react-native-unistyles/plugin`'s Babel transform for `withUnistyles(...)`
 * emits code that reads a global `React` binding rather than the module's own
 * import, so any file that relies on the automatic JSX runtime (no `import
 * React from "react"`) and also calls `withUnistyles` throws "React is not
 * defined" the moment it renders in the browser project — the `unit` project
 * never hits this because jsdom + the classic test transform pulls React in
 * globally by a different path.
 */
import React from "react";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
