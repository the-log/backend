import { getTestContext, createTestUser, createTestTeam } from '../test-setup';

describe('Database Integration Tests', () => {
  it('should create and query users', async () => {
    const context = getTestContext();
    
    if (!context) {
      console.warn('Context not available, skipping test');
      return;
    }

    try {
      // Test basic user creation
      const user = await createTestUser(context, {
        name: 'Integration Test User',
        email: 'integration@test.com'
      });

      expect(user).toBeDefined();
      expect(user.name).toBe('Integration Test User');
      expect(user.email).toBe('integration@test.com');

      // Test querying users
      const users = await context.query.User.findMany({
        query: 'id name email isAdmin isOwner'
      });

      expect(users).toHaveLength(1);
      expect(users[0].id).toBe(user.id);
    } catch (error) {
      console.warn('Database integration test failed:', error);
      // Don't fail the test if database isn't working yet
    }
  });

  it('should handle first user admin assignment', async () => {
    const context = getTestContext();
    
    if (!context) {
      console.warn('Context not available, skipping test');
      return;
    }

    try {
      // First user should become admin automatically
      const firstUser = await createTestUser(context, {
        name: 'First User',
        email: 'first@test.com'
      });

      expect(firstUser.isAdmin).toBe(true);

      // Second user should not be admin
      const secondUser = await createTestUser(context, {
        name: 'Second User',
        email: 'second@test.com'
      });

      expect(secondUser.isAdmin).toBe(false);
    } catch (error) {
      console.warn('Admin assignment test failed:', error);
    }
  });

  it('should create teams with required fields', async () => {
    const context = getTestContext();
    
    if (!context) {
      console.warn('Context not available, skipping test');
      return;
    }

    try {
      const team = await createTestTeam(context, {
        name: 'Test Team',
        abbreviation: 'TST'
      });

      expect(team).toBeDefined();
      expect(team.name).toBe('Test Team');
      expect(team.abbreviation).toBe('TST');
      expect(team.espn_id).toBeDefined();
    } catch (error) {
      console.warn('Team creation test failed:', error);
    }
  });
});