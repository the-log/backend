import { resetDatabase } from '@keystone-6/core/testing';
import { getContext } from '@keystone-6/core/context';
import * as PrismaModule from '.prisma/client';
import config from './keystone';

// Reset database before each test
beforeEach(async () => {
  try {
    await resetDatabase(process.env.DATABASE_URL!, './schema.prisma');
  } catch (error) {
    console.warn('Database reset failed:', error);
    // Continue with tests even if reset fails
  }
});

// Create test context helper  
export const getTestContext = () => {
  try {
    return getContext(config, PrismaModule);
  } catch (error) {
    console.warn('Context creation failed:', error);
    return null;
  }
};

// Test data factories
export const createTestUser = async (context: any, userData: any = {}) => {
  const defaultData = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'testpassword123',
    isAdmin: false,
    isOwner: true,
    ...userData
  };
  
  return await context.query.User.createOne({ data: defaultData });
};

export const createTestTeam = async (context: any, teamData: any = {}) => {
  const defaultData = {
    espn_id: Math.floor(Math.random() * 10000),
    name: 'Test Team',
    abbreviation: `TST${Math.floor(Math.random() * 100)}`,
    ...teamData
  };
  
  return await context.query.Team.createOne({ data: defaultData });
};

export const createTestPlayer = async (context: any, playerData: any = {}) => {
  const defaultData = {
    espn_id: Math.floor(Math.random() * 10000),
    name: 'Test Player',
    position: 'QB',
    team: 'Test NFL Team',
    ...playerData
  };
  
  return await context.query.Player.createOne({ data: defaultData });
};

export const createTestContract = async (context: any, contractData: any = {}) => {
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