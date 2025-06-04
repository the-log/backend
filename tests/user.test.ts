import { getContext } from '@keystone-6/core/context';
import config from '../keystone';
import * as PrismaModule from '@prisma/client';
import { deleteAllData, runAccessControlTests } from './testUtils';

import { getUniqueValue } from './testUtils';

const uniqueEmail = `test+${getUniqueValue()}@example.com`;
runAccessControlTests({
  listKey: 'User',
  validCreateData: { name: 'Test', email: uniqueEmail, password: 'password123' },
  updateData: { name: 'Updated' },
  sessionScenarios: [
    { name: 'Admin', session: { data: { isAdmin: true } }, canCreate: true, canRead: true, canUpdate: true, canDelete: true },
    { name: 'Non-admin', session: { data: { isAdmin: false } }, canCreate: false, canRead: true, canUpdate: false, canDelete: false },
    { name: 'Unauthenticated', session: false, canCreate: false, canRead: false, canUpdate: false, canDelete: false }
  ]
});

describe('User Items', () => {
  let context: any;

  beforeEach(async () => {
    await deleteAllData();
  });

  it('the first user should be an admin', async () => {
    const context = getContext(config, PrismaModule).sudo();
    const user = await context.db.User.createOne({
      data: { name: 'User', email: 'user@example.com', password: 'password123' }
    });
    expect(user).toBeDefined();
    expect(user.isAdmin).toBe(true);
  });

  it('should allow users to update own info', async () => {
    // Admin user should create users
    let context = getContext(config, PrismaModule).sudo();
    const user = await context.db.User.createOne({
      data: { name: 'User', email: 'user@example.com', password: 'password123' }
    });

    // Log in as created user
    context = getContext(config, PrismaModule).withSession({
      itemId: user.id,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        isAdmin: false,
      }
    });

    // User should be able to update own info
    const updatedUser = await context.db.User.updateOne({
      where: { id: user.id },
      data: {
        name: 'User2',
        email: 'user2@example.com'
      }
    });
    expect(updatedUser).toBeDefined();
    expect(updatedUser?.name).toBe('User2');
    expect(updatedUser?.email).toBe('user2@example.com');
  });

  it('should not allow creating a user with a duplicate email', async () => {
    // Mock console.error to prevent it from printing to the console
    jest.spyOn(console, 'error').mockImplementation();
    const context = getContext(config, PrismaModule).sudo();
    await context.db.User.createOne({
      data: { name: 'User1', email: 'duplicate@example.com', password: 'password123' }
    });
    await expect(
      context.db.User.createOne({
        data: { name: 'User2', email: 'duplicate@example.com', password: 'password123' }
      })
    ).rejects.toThrow();
  });

  it('should not allow creating a user with a short password', async () => {
    const context = getContext(config, PrismaModule).sudo();
    await expect(
      context.db.User.createOne({
        data: { name: 'User', email: 'shortpw@example.com', password: '1234567' }
      })
    ).rejects.toThrow();
  });

  it('should not allow a non-admin to set isAdmin: true', async () => {
    const context = getContext(config, PrismaModule).withSession({ data: { isAdmin: false } });
    await expect(
      context.db.User.createOne({
        data: { name: 'User', email: 'user@example.com', password: 'password123', isAdmin: true }
      })
    ).rejects.toThrow();
  });

  it('should allow assigning a team to a user', async () => {
    let context = getContext(config, PrismaModule).sudo();
    const team = await context.db.Team.createOne({
      data: { name: 'Test Team', abbreviation: 'TT', espn_id: 1 }
    });
    const user = await context.db.User.createOne({
      data: { name: 'Team Owner', email: 'owner@example.com', password: 'password123', team: { connect: { id: team.id } } }
    });

    const foundUser = await context.graphql.run({
      query: `
        query($id: ID!) {
          user(where: { id: $id }) {
            id
            team { id }
          }
        }
      `,
      variables: { id: user.id }
    });
    expect((foundUser as any).user.teamId || (foundUser as any).user.team?.id).toBe(team.id);
  });
});
