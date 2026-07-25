// Load test environment variables before running tests
require('dotenv').config({ path: '.env.test', quiet: true });

// keystone.ts loads .env via dotenv, which would otherwise hand the real league
// webhook to the test run. Tests that exercise posting set this themselves.
process.env.DISCORD_WEBHOOK_URL = '';
