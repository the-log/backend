import 'dotenv/config';
import { config } from '@keystone-6/core';
import { lists } from './schema';
import { withAuth, session } from './auth';

const {
  COOKIE_SECRET: sessionSecret,
  DATABASE_TYPE: dbType,
  DATABASE_URL: dbUrl,
} = process.env;

export default withAuth(
  // Using the config function helps typescript guide you to the available options.
  config({
    // the db sets the database provider - we're using sqlite for the fastest startup experience
    db: {
      provider: dbType as 'postgresql' | 'sqlite',
      url: dbUrl as string,
    },
    // This config allows us to set up features of the Admin UI https://keystonejs.com/docs/apis/config#ui
    ui: {
      // For our starter, we check that someone has session data before letting them see the Admin UI.
      isAccessAllowed: (context) => !!context.session?.data
    },
    lists,
    session,
    server: {
      cors: {
        origin: [
          'http://localhost:7777',
          'http://app.log.football',
          'https://app.log.football',
          'http://log.football',
          'https://log.football',
        ],
        credentials: true,
      }
    },
    graphql: {
      playground: true
    }
  })
);
