# Backend Testing

## Running tests

```bash
cd backend
npm test              # Run once
npm run test:watch    # Watch mode
```

Tests run locally and on CI ([.github/workflows/test.yml](.github/workflows/test.yml)) on every PR to `main`/`master`.

## How the harness is wired

- **Runner:** Jest with TypeScript support (see [jest.config.js](jest.config.js)).
- **Database:** SQLite. Chosen so GitHub Actions can run the full suite without spinning up a Postgres service container. The test DB lives at `backend/test.db` and is created / reset by the test setup.
- **Env loading:** [jest.env.js](jest.env.js) loads [.env.test](.env.test) before any test runs. `.env.test` is the **only** env file the test harness reads.
- **Factories & context helpers:** [test-setup.ts](test-setup.ts) exposes `getAdminContext()`, `getContextWithSession()`, and factories (`createTestUser`, `createTestTeam`, `createTestPlayer`, `createTestContract`). Add new factories here as later phases need them.

> **Note:** there used to be a `test.env` file with Postgres + ESPN scraper credentials. It was not used by Jest (it wasn't referenced anywhere in code) and has been removed. If you need scraper credentials locally, put them in `.env`, which is what the scraper actually loads via `dotenv/config`.

## Current test files

| File | Type | Covers |
|---|---|---|
| [__tests__/simple.test.ts](__tests__/simple.test.ts) | Sanity | Jest + env configuration |
| [__tests__/access-control.test.ts](__tests__/access-control.test.ts) | Unit (mocked) | Access rules: roles, bid filtering, contract access, user profile |
| [__tests__/hooks.test.ts](__tests__/hooks.test.ts) | Unit (mocked) | Contract logging hook (create/update/delete) |
| [__tests__/database-integration.test.ts](__tests__/database-integration.test.ts) | Integration (real SQLite) | User creation, first-admin hook, Team CRUD, ContractLogEntry side effect, non-admin rejection |

## Writing new tests

**Unit tests** (mocked): fast, isolated, good for pure functions, access-rule logic, and hooks where you want to verify what was passed to a downstream call.

**Integration tests** (real DB): spin up a context with `getAdminContext()` or `getContextWithSession(...)`, run Keystone queries/mutations against the real SQLite DB, assert post-state. Use this for virtual field resolvers, script logic, and anything that depends on relationship traversal.

Prefer integration when the code under test is DB-bound (e.g. resolvers, hooks that query other lists, offseason / free-agency scripts). Unit tests are fine for pure logic that only touches its own arguments.

### Pattern for a new integration test

```ts
import { getAdminContext, createTestTeam, createTestPlayer } from '../test-setup';

describe('Thing under test', () => {
  it('does the thing', async () => {
    const context = getAdminContext();
    const team = await createTestTeam(context);
    // ... arrange, act, assert against context.query.X.findMany(...)
  });
});
```

Add a factory to [test-setup.ts](test-setup.ts) the first time a test needs a new entity type (Bid, Trade, DraftPick, ContractLogEntry, etc.), rather than inlining creation in the test.

## Troubleshooting

- **`the URL must start with the protocol postgresql://`** — you have `DATABASE_TYPE=postgresql` leaking into the test run. Check that nothing in your shell is overriding what `.env.test` sets.
- **Stale test DB** — delete `backend/test.db` and `backend/test.db-journal`, then rerun.
- **Type errors only under `tsc --noEmit`** — Keystone's generated types can be noisy. Tests themselves passing in Jest is the source of truth; fix tsc noise separately.
