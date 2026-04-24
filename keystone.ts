import 'dotenv/config';
import { config } from '@keystone-6/core';
import { lists } from './schema';
import { withAuth, session } from './auth';

const {
  DATABASE_TYPE: dbType,
  DATABASE_URL: dbUrl,
  CORS_ORIGINS: corsOriginsEnv,
  NODE_ENV,
} = process.env;

if (dbType !== 'postgresql' && dbType !== 'sqlite') {
  throw new Error(
    `DATABASE_TYPE must be 'postgresql' or 'sqlite' (got: ${dbType ?? 'undefined'})`
  );
}
if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

const isProd = NODE_ENV === 'production';
const defaultCorsOrigins = [
  'http://localhost:7777',
  'http://app.log.football',
  'https://app.log.football',
  'http://log.football',
  'https://log.football',
  'https://app.log.ddev.site',
];

const corsOrigins = corsOriginsEnv
  ? corsOriginsEnv.split(',').map((s) => s.trim()).filter(Boolean)
  : defaultCorsOrigins;

export default withAuth(
  config({
    db: {
      provider: dbType,
      url: dbUrl,
    },
    ui: {
      isAccessAllowed: (context) => !!context.session?.data,
    },
    lists,
    session,
    server: {
      cors: {
        origin: corsOrigins,
        credentials: true,
      },
      options: {
        host: isProd ? '127.0.0.1' : '0.0.0.0',
        port: 3000,
      },
    },
    graphql: {
      playground: true,
      apolloConfig: {
        introspection: true,
      },
    },
  })
);
