// Preloaded by dotenv-load-order.test.ts, ahead of a script entrypoint running
// under tsx. Not a jest test.
//
// Keystone's package entrypoints pick a .cjs.dev.js or .cjs.prod.js bundle
// based on process.env.NODE_ENV at require time. If NODE_ENV arrives partway
// through the import graph the two halves disagree and Keystone gets loaded
// twice, so this reports which copies of create-admin-meta the entrypoint left
// in the require cache.

const report = (error) =>
  console.log(
    `BUNDLE_REPORT ${JSON.stringify({
      error,
      bundles: Object.keys(require.cache)
        .filter((p) => /create-admin-meta-\w+\.cjs\.(dev|prod)\.js$/.test(p))
        .map((p) => p.split('/').pop()),
    })}`
  );

process.on('uncaughtException', (error) => {
  report(error.message);
  process.exit(0);
});

// Runs once the entrypoint has finished evaluating, which is as far as we want
// to get: its top-level IIFE is parked on the first await and never reaches the
// database.
setImmediate(() => {
  report(undefined);
  process.exit(0);
});
