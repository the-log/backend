import { getContext } from '@keystone-6/core/context';
import config from '../keystone';
import * as PrismaModule from '@prisma/client';
import { deleteAllData, runAccessControlTests } from './testUtils';

runAccessControlTests({
  listKey: 'Player',
  validCreateData: { name: 'Test', espn_id: 1 },
  updateData: { name: 'Updated' },
  sessionScenarios: [
    { name: 'Admin', session: { data: { isAdmin: true } }, canCreate: true, canRead: true, canUpdate: true, canDelete: true },
    { name: 'Non-admin', session: { data: { isAdmin: false } }, canCreate: false, canRead: true, canUpdate: false, canDelete: false },
    { name: 'Unauthenticated', session: false, canCreate: false, canRead: false, canUpdate: false, canDelete: false }
  ]
});

describe('Player Items', () => {
  beforeEach(async () => {
    await deleteAllData();
  });

  it('test placeholder', async () => {
    expect(true).toBe(true);
  });

});
