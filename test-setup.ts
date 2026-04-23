import { resetDatabase } from '@keystone-6/core/testing';
import { getContext } from '@keystone-6/core/context';
import * as PrismaModule from '.prisma/client';
import config from './keystone';
import { KeystoneContext } from '@keystone-6/core/types';

beforeEach(async () => {
  await resetDatabase(process.env.DATABASE_URL!, './schema.prisma');
});

export const getTestContext = () => getContext(config, PrismaModule);

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
