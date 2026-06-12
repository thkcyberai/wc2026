// (intentionally unused) — auto-refresh scheduling lives in src/lib/db.ts,
// which is a Node-only module. Bundling DB code here broke the Edge-runtime
// build, so the instrumentation hook is disabled in next.config.mjs.
export {};
