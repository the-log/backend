import { resetDatabase } from '@keystone-6/core/testing';
import { getContext } from '@keystone-6/core/context';
import * as PrismaModule from '.prisma/client';
import config from './keystone';
import { KeystoneContext } from '@keystone-6/core/types';

beforeEach(async () => {
  await resetDatabase(process.env.DATABASE_URL!, './schema.prisma');
});

export const getTestContext = () => getContext(config, PrismaModule);

export const getContextWithSession = (session: any) =>
  getContext(config, PrismaModule).withSession(session);

export const getAdminContext = () => {
  const adminSession = {
    itemId: 'test-admin-id',
    data: {
      id: 'test-admin-id',
      name: 'Test Admin',
      email: 'admin@test.com',
      isAdmin: true,
      isOwner: true,
      team: null
    }
  };
  return getContext(config, PrismaModule).withSession(adminSession);
};

// Test data factories
export const createTestUser = async (context: KeystoneContext, userData: any = {}) => {
  const defaultData = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'testpassword123',
    isAdmin: false,
    isOwner: true,
    ...userData
  };

  return await context.query.User.createOne({
    data: defaultData,
    query: 'id name email isAdmin isOwner'
  });
};

export const createTestTeam = async (context: KeystoneContext, teamData: any = {}) => {
  const defaultData = {
    espn_id: Math.floor(Math.random() * 10000),
    name: 'Test Team',
    abbreviation: `TST${Math.floor(Math.random() * 100)}`,
    ...teamData
  };

  return await context.query.Team.createOne({
    data: defaultData,
    query: 'id name abbreviation espn_id'
  });
};

export const createTestPlayer = async (context: KeystoneContext, playerData: any = {}) => {
  const defaultData = {
    espn_id: Math.floor(Math.random() * 10000),
    name: 'Test Player',
    position: 'QB',
    team: 'Test NFL Team',
    ...playerData
  };

  return await context.query.Player.createOne({ data: defaultData });
};

export const createTestContract = async (context: KeystoneContext, contractData: any = {}) => {
  const defaultData = {
    salary: 5000,
    years: 2,
    status: 'active',
    ...contractData
  };

  return await context.query.Contract.createOne({ data: defaultData });
};

export const createTestBid = async (context: KeystoneContext, bidData: any = {}) => {
  const defaultData = {
    salary: 5000,
    years: 2,
    ...bidData
  };

  return await context.query.Bid.createOne({ data: defaultData });
};

// Creates a real admin User row in the test DB and returns a Keystone context
// whose session.itemId points at that user. Needed whenever a test creates a
// Contract, because Contract's afterOperation hook writes a ContractLogEntry
// that `connect`s to the session user — the fake id in getAdminContext() fails.
export const setupAdminContext = async () => {
  const seedContext = getAdminContext();
  const admin = await createTestUser(seedContext, {
    name: 'Test Admin (seeded)',
    email: `admin-${Date.now()}-${Math.random()}@test.com`,
  });
  return getContextWithSession({
    itemId: admin.id,
    data: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      isAdmin: true,
      isOwner: true,
      team: null,
    },
  });
};

// Session helpers
export const createAdminSession = (user: any, team?: any) => ({
  itemId: user.id,
  data: {
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: true,
    isOwner: true,
    team: team ? { id: team.id } : user.team
  }
});

export const createOwnerSession = (user: any, team: any) => ({
  itemId: user.id,
  data: {
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: false,
    isOwner: true,
    team: { id: team.id }
  }
});

export const createGuestSession = (user: any) => ({
  itemId: user.id,
  data: {
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: false,
    isOwner: false,
    team: null
  }
});
