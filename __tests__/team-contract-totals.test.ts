import {
  getAdminContext,
  getContextWithSession,
  createTestUser,
  createTestTeam,
  createTestPlayer,
} from '../test-setup';
import { KeystoneContext } from '@keystone-6/core/types';

let espnIdCounter = 1;
const nextEspnId = () => espnIdCounter++;

// The Contract afterOperation hook writes a ContractLogEntry and connects it
// to the session user — the session.itemId must point at a real User row or
// the connect fails. Create one and return a context bound to its session.
async function setupAdminContext() {
  const seedContext = getAdminContext();
  const admin = await createTestUser(seedContext, {
    name: 'Contract Totals Admin',
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
}

async function seedContract(
  context: KeystoneContext,
  team: Record<string, any>,
  overrides: Record<string, unknown> = {},
) {
  const player = await createTestPlayer(context, { espn_id: nextEspnId() });
  return context.query.Contract.createOne({
    data: {
      salary: 10000,
      years: 2,
      status: 'active',
      team: { connect: { id: team.id } },
      player: { connect: { id: player.id } },
      ...overrides,
    },
    query: 'id',
  });
}

async function readTotals(context: KeystoneContext, teamId: string) {
  const team = await context.query.Team.findOne({
    where: { id: teamId },
    query: 'contractTotals',
  });
  return team.contractTotals;
}

describe('Team.contractTotals virtual field', () => {
  beforeEach(() => {
    espnIdCounter = 1;
  });

  it('returns all zeros for a team with no contracts', async () => {
    const context = await setupAdminContext();
    const team = await createTestTeam(context);

    expect(await readTotals(context, team.id)).toEqual({
      salary: 0,
      years: 0,
      active: 0,
      dts: 0,
      ir: 0,
      waived: 0,
    });
  });

  it('counts an active contract at full salary and full years', async () => {
    const context = await setupAdminContext();
    const team = await createTestTeam(context);
    await seedContract(context, team, { status: 'active', salary: 10000, years: 3 });

    expect(await readTotals(context, team.id)).toEqual({
      salary: 10000,
      years: 3,
      active: 1,
      dts: 0,
      ir: 0,
      waived: 0,
    });
  });

  it('counts a dts contract at salary / 10 and does not add years', async () => {
    const context = await setupAdminContext();
    const team = await createTestTeam(context);
    await seedContract(context, team, { status: 'dts', salary: 10000, years: 3 });

    expect(await readTotals(context, team.id)).toEqual({
      salary: 1000,
      years: 0,
      active: 0,
      dts: 1,
      ir: 0,
      waived: 0,
    });
  });

  it('counts an ir contract at salary / 2 and years - 1', async () => {
    const context = await setupAdminContext();
    const team = await createTestTeam(context);
    await seedContract(context, team, { status: 'ir', salary: 10000, years: 3 });

    expect(await readTotals(context, team.id)).toEqual({
      salary: 5000,
      years: 2,
      active: 0,
      dts: 0,
      ir: 1,
      waived: 0,
    });
  });

  // League rule: waiving a contract reduces whatever term remained to a
  // single year. Frees cap space for the team but blocks "buy and dump"
  // abuse by ensuring the owner still eats one year of cap regardless
  // of the original contract length.
  it('counts a waived contract at salary / 2 and collapses term to 1 year regardless of contract years', async () => {
    const context = await setupAdminContext();
    const team = await createTestTeam(context);
    await seedContract(context, team, { status: 'waived', salary: 10000, years: 5 });

    expect(await readTotals(context, team.id)).toEqual({
      salary: 5000,
      years: 1,
      active: 0,
      dts: 0,
      ir: 0,
      waived: 1,
    });
  });

  it('ignores rfa contracts entirely', async () => {
    const context = await setupAdminContext();
    const team = await createTestTeam(context);
    await seedContract(context, team, { status: 'rfa', salary: 10000, years: 3 });

    expect(await readTotals(context, team.id)).toEqual({
      salary: 0,
      years: 0,
      active: 0,
      dts: 0,
      ir: 0,
      waived: 0,
    });
  });

  it('aggregates a mix of statuses on one team', async () => {
    const context = await setupAdminContext();
    const team = await createTestTeam(context);

    await seedContract(context, team, { status: 'active', salary: 1000, years: 2 });
    await seedContract(context, team, { status: 'active', salary: 2000, years: 3 });
    await seedContract(context, team, { status: 'dts',    salary: 500,  years: 1 });
    await seedContract(context, team, { status: 'ir',     salary: 800,  years: 4 });
    await seedContract(context, team, { status: 'waived', salary: 600,  years: 2 });

    expect(await readTotals(context, team.id)).toEqual({
      salary: 1000 + 2000 + 500 / 10 + 800 / 2 + 600 / 2,
      years: 2 + 3 + 0 + (4 - 1) + 1,
      active: 2,
      dts: 1,
      ir: 1,
      waived: 1,
    });
  });

  it('does not include contracts belonging to another team', async () => {
    const context = await setupAdminContext();
    const teamA = await createTestTeam(context, {
      espn_id: nextEspnId(),
      abbreviation: 'AAA',
    });
    const teamB = await createTestTeam(context, {
      espn_id: nextEspnId(),
      abbreviation: 'BBB',
    });

    await seedContract(context, teamA, { status: 'active', salary: 1000, years: 2 });
    await seedContract(context, teamB, { status: 'active', salary: 9999, years: 9 });

    expect(await readTotals(context, teamA.id)).toEqual({
      salary: 1000,
      years: 2,
      active: 1,
      dts: 0,
      ir: 0,
      waived: 0,
    });
  });

});
