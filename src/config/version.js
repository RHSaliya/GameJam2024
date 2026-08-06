// __APP_VERSION__ is replaced at build time by the Vite define in
// vite.config.js. The typeof guard keeps this module importable from Node
// test runs and from `vite dev` before the define is applied.
export const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';
export const VERSION_LABEL = `v${APP_VERSION}`;
