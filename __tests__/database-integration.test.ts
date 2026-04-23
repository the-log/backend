import {
  getAdminContext,
  getContextWithSession,
  createTestUser,
  createTestTeam,
  createTestPlayer,
} from '../test-setup';

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

  it('should create a ContractLogEntry when a contract is created', async () => {
    const adminContext = getAdminContext();

    const user = await createTestUser(adminContext, {
      name: 'Admin',
      email: 'admin@test.com',
    });
    const team = await createTestTeam(adminContext);
    const player = await createTestPlayer(adminContext);

    const userContext = getContextWithSession({
      itemId: user.id,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: true,
        isOwner: true,
        team: { id: team.id },
      },
    });

    const contract = await userContext.query.Contract.createOne({
      data: {
        salary: 5000,
        years: 2,
        status: 'active',
        team: { connect: { id: team.id } },
        player: { connect: { id: player.id } },
      },
      query: 'id',
    });

    const logEntries = await adminContext.query.ContractLogEntry.findMany({
      query: 'id message user { id } team { id } player { id } contract { id }',
    });

    expect(logEntries).toHaveLength(1);
    expect(logEntries[0].message).toBe('New Contract');
    expect(logEntries[0].user.id).toBe(user.id);
    expect(logEntries[0].team.id).toBe(team.id);
    expect(logEntries[0].player.id).toBe(player.id);
    expect(logEntries[0].contract.id).toBe(contract.id);
  });

  it('should reject contract creation by non-admin users', async () => {
    const adminContext = getAdminContext();

    await createTestUser(adminContext, {
      name: 'First Admin',
      email: 'first@test.com',
    });
    const team = await createTestTeam(adminContext);
    const player = await createTestPlayer(adminContext);
    const owner = await createTestUser(adminContext, {
      name: 'Team Owner',
      email: 'owner@test.com',
    });

    const ownerContext = getContextWithSession({
      itemId: owner.id,
      data: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        isAdmin: false,
        isOwner: true,
        team: { id: team.id },
      },
    });

    await expect(
      ownerContext.query.Contract.createOne({
        data: {
          salary: 5000,
          years: 2,
          status: 'active',
          team: { connect: { id: team.id } },
          player: { connect: { id: player.id } },
        },
      })
    ).rejects.toThrow();
  });
});
