/*
 * @see: https://keystonejs.com/docs/apis/auth
 */

import { createAuth } from '@keystone-6/auth';

import { statelessSessions } from '@keystone-6/core/session';
import sendMail from "./utils/mail";

let sessionSecret = process.env.COOKIE_SECRET;

if (!sessionSecret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'The COOKIE_SECRET environment variable must be set in production'
    );
  } else {
    sessionSecret = '-- DEV COOKIE SECRET; CHANGE ME --';
  }
}

const { withAuth } = createAuth({
  listKey: 'User',
  identityField: 'email',
  sessionData: 'name team { id } isAdmin isOwner',
  secretField: 'password',
  initFirstItem: {
    fields: ['name', 'email', 'password'],
  },
  passwordResetLink: {
    sendToken: async ({ itemId, identity, token, context }) => {
      await sendMail(identity, 'Password reset link', `Token: ${token}`);
    },
    tokensValidForMins: 60,
  },
  magicAuthLink: {
    sendToken: async ({ itemId, identity, token, context }) => {
      await sendMail(identity, 'Magic link', `Token: ${token}`);
     },
    tokensValidForMins: 60,
  },
});

let sessionMaxAge = 60 * 60 * 24 * 30; // 30 days

const isProd = process.env.NODE_ENV === 'production';

const session = statelessSessions({
  maxAge: sessionMaxAge,
  secret: sessionSecret!,
  sameSite: isProd ? 'none' : 'lax',
  secure: isProd,
});

export { withAuth, session };
