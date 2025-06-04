import { getContext } from '@keystone-6/core/context';
import config from '../keystone';
import * as PrismaModule from '@prisma/client';
import { deleteAllData, runAccessControlTests } from './testUtils';

import { getUniqueValue } from './testUtils';

const uniqueEspnId = parseInt(getUniqueValue('espn_id_'));
const uniqueAbbr = `TST${getUniqueValue()}`;
const uniqueName = `Test ${getUniqueValue()}`;

import { sanitizeEspnIdValue } from './testUtils';

runAccessControlTests({
  listKey: 'Team',
  validCreateData: { name: uniqueName, abbreviation: uniqueAbbr, espn_id: sanitizeEspnIdValue(uniqueEspnId) },
  updateData: { name: 'Updated' },
  sessionScenarios: [
    { name: 'Admin', session: { data: { isAdmin: true } }, canCreate: true, canRead: true, canUpdate: true, canDelete: true },
    { name: 'Non-admin', session: { data: { isAdmin: false } }, canCreate: false, canRead: true, canUpdate: false, canDelete: false },
    { name: 'Unauthenticated', session: false, canCreate: false, canRead: false, canUpdate: false, canDelete: false }
  ]
});

describe('Team Items', () => {
  beforeEach(async () => {
    await deleteAllData();
  });

  it('should not be referenced by a previous owner', async () => {
    // Create a team as admin
    let context = getContext(config, PrismaModule).withSession({ data: { isAdmin: true } });
    const team = await context.db.Team.createOne({
      data: { name: 'Delta', abbreviation: 'DEL', espn_id: 103 }
    });

    // Create a user as admin
    const user = await context.db.User.createOne({
      data: { name: 'User', email: 'user@example.com', password: 'password123' }
    });

    // Create a second user as admin
    const user2 = await context.db.User.createOne({
      data: { name: 'User2', email: 'user2@example.com', password: 'password123' }
    });

    // Assign the team to the first user
    await context.db.Team.updateOne({
      where: { id: team.id },
      data: { owner: { connect: { id: user.id } } }
    });

    // Check first user's team
    let foundUser = await context.graphql.run({
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
    expect((foundUser as any)?.user?.team?.id).toBe(team.id);

    // Assign the team to the second user
    await context.db.Team.updateOne({
      where: { id: team.id },
      data: { owner: { connect: { id: user2.id } } }
    });

    // Check second user's team
    foundUser = await context.graphql.run({
      query: `
        query($id: ID!) {
          user(where: { id: $id }) {
            id
            team { id }
          }
        }
      `,
      variables: { id: user2.id }
    });
    expect((foundUser as any)?.user?.team?.id).toBe(team.id);

    // Check first user's team
    foundUser = await context.graphql.run({
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
    expect((foundUser as any)?.user?.team).toBeNull();
  });
});
