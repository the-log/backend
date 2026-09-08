import { spawnSync } from 'child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

// The production server's .env sets NODE_ENV. That only reaches process.env
// once dotenv runs, so any Keystone module required before it resolves the dev
// bundle while everything after resolves the prod one — which used to crash
// every script with "unexpected call to getAdminMetaInRelationshipField".
// Each entrypoint imports dotenv/config first to keep that from happening.

const root = path.resolve(__dirname, '..');
const tsx = path.join(root, 'node_modules', '.bin', 'tsx');
const preload = path.join(__dirname, 'fixtures', 'report-bundles.js');

const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const entrypoints: string[] = Object.values<string>(packageJson.scripts)
  .map((command) => /^tsx (scripts\/\S+\.ts)$/.exec(command)?.[1])
  .filter((entry): entry is string => entry !== undefined);

// dotenv never overwrites a variable that is already set, so the child has to
// start without NODE_ENV for the fixture's value to be the one that lands.
const envFile = path.join(mkdtempSync(path.join(tmpdir(), 'log-dotenv-')), 'server.env');
writeFileSync(
  envFile,
  [readFileSync(path.join(root, '.env.test'), 'utf8'), 'NODE_ENV=production', 'DISCORD_WEBHOOK_URL=', ''].join('\n')
);

const loadEntrypoint = (entry: string) => {
  const result = spawnSync(tsx, ['--require', preload, entry], {
    cwd: root,
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      DOTENV_CONFIG_PATH: envFile,
    },
  });

  if (result.status !== 0) {
    throw new Error(`${entry} exited ${result.status}:\n${result.stderr}`);
  }

  const report = result.stdout.split('\n').find((line) => line.startsWith('BUNDLE_REPORT '));
  if (!report) {
    throw new Error(`${entry} printed no bundle report:\n${result.stdout}\n${result.stderr}`);
  }

  return JSON.parse(report.replace('BUNDLE_REPORT ', ''));
};

it('finds entrypoints to check', () => {
  expect(entrypoints.length).toBeGreaterThan(0);
});

describe.each(entrypoints)('%s', (entry) => {
  it('loads one copy of Keystone with NODE_ENV coming from .env', () => {
    const { error, bundles } = loadEntrypoint(entry);

    expect(error ?? '').not.toContain('getAdminMetaInRelationshipField');
    // One bundle, and the production one: proof that dotenv ran before the
    // first Keystone module chose a build.
    expect(bundles).toEqual([expect.stringMatching(/\.cjs\.prod\.js$/)]);
  }, 60000);
});
