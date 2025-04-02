/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
// Generated by unplugin-vue-router. ‼️ DO NOT MODIFY THIS FILE ‼️
// It's recommended to commit this file.
// Make sure to add this file to your tsconfig.json file as an "includes" or "files" entry.

declare module 'vue-router/auto-routes' {
  import type {
    RouteRecordInfo,
    ParamValue,
    ParamValueOneOrMore,
    ParamValueZeroOrMore,
    ParamValueZeroOrOne,
  } from 'unplugin-vue-router/types'

  /**
   * Route name map generated by unplugin-vue-router
   */
  export interface RouteNamedMap {
    '/': RouteRecordInfo<'/', '/', Record<never, never>, Record<never, never>>,
    '/[...all]': RouteRecordInfo<'/[...all]', '/:all(.*)', { all: ParamValue<true> }, { all: ParamValue<false> }>,
    '/admin': RouteRecordInfo<'/admin', '/admin', Record<never, never>, Record<never, never>>,
    '/contact': RouteRecordInfo<'/contact', '/contact', Record<never, never>, Record<never, never>>,
    '/dashboard': RouteRecordInfo<'/dashboard', '/dashboard', Record<never, never>, Record<never, never>>,
    '/hi/[name]': RouteRecordInfo<'/hi/[name]', '/hi/:name', { name: ParamValue<true> }, { name: ParamValue<false> }>,
    '/home': RouteRecordInfo<'/home', '/home', Record<never, never>, Record<never, never>>,
    '/natijalar': RouteRecordInfo<'/natijalar', '/natijalar', Record<never, never>, Record<never, never>>,
    '/README': RouteRecordInfo<'/README', '/README', Record<never, never>, Record<never, never>>,
    '/signup': RouteRecordInfo<'/signup', '/signup', Record<never, never>, Record<never, never>>,
  }
}
