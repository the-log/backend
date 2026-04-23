import { getAdminContext, createTestUser, createTestTeam } from '../test-setup';

describe('Database Integration Tests', () => {
  it('should create and query users', async () => {
    const context = getAdminContext();

    const user = await createTestUser(context, {
      name: 'Integration Test User',
      email: 'integration@test.com'
    });

    expect(user).toBeDefined();
    expect(user.name).toBe('Integration Test User');
    expect(user.email).toBe('integration@test.com');

    const users = await context.query.User.findMany({
      query: 'id name email isAdmin isOwner'
    });

    expect(users).toHaveLength(1);
    expect(users[0].id).toBe(user.id);
  });

  it('should handle first user admin assignment', async () => {
    const context = getAdminContext();

    const firstUser = await createTestUser(context, {
      name: 'First User',
      email: 'first@test.com'
    });

    expect(firstUser.isAdmin).toBe(true);

    const secondUser = await createTestUser(context, {
      name: 'Second User',
      email: 'second@test.com'
    });

    expect(secondUser.isAdmin).toBe(false);
  });

  it('should create teams with required fields', async () => {
    const context = getAdminContext();

    const team = await createTestTeam(context, {
      name: 'Test Team',
      abbreviation: 'TST'
    });

    expect(team).toBeDefined();
    expect(team.name).toBe('Test Team');
    expect(team.abbreviation).toBe('TST');
    expect(team.espn_id).toBeDefined();
  });
});
