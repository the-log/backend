// backend/tests/testUtils.ts
import { getContext } from '@keystone-6/core/context';
import config from '../keystone';
import * as PrismaModule from '@prisma/client';
import keystone from '../keystone';

// Unique value generators for tests
let uniqueCounter = 0;
let uniqueIntCounter = 0;
export function getUniqueValue(prefix = ''): string {
  uniqueCounter++;
  return `${prefix}${Date.now()}_${uniqueCounter}_${Math.floor(Math.random() * 10000)}`;
}
export function getUniqueInt(): number {
  uniqueIntCounter++;
  // Always stays below 2_000_000_000
  return (Math.floor(Math.random() * 1_000_000_000) + uniqueIntCounter) % 2147483647;
}


// Get all list keys programmatically
const listKeys = Object.keys(config.lists);

export async function deleteAllData() {
  const sudo = getContext(config, PrismaModule).sudo();
  try {
    for (const listKey of listKeys) {
      if (sudo.db[listKey]) {
        const items = await sudo.db[listKey].findMany({}).catch((): any[] => []);
        for (const item of items) {
          try {
            await sudo.db[listKey].deleteOne({ where: { id: item.id } });
          } catch (err: any) {
            console.log(`Warning: Failed to delete ${listKey} with ID ${item.id}. Continuing...`);
          }
        }
      }
    }
  } catch (error: any) {
    console.error(`Error in deleteAllData: ${error}`);
  } finally {
    // Always ensure connection is closed
    await sudo.prisma.$disconnect().catch((e: Error) => console.error(`Error disconnecting: ${e}`));
  }
}

type AccessTestOptions = {
  listKey: string;
  validCreateData: Record<string, any>;
  updateData?: Record<string, any>;
  sessionScenarios: {
    name: string;
    session: any;
    canCreate?: boolean;
    canRead?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
  }[];
  ensureDependencies?: (context: any) => Promise<Record<string, any>>;
};

export async function ensurePlayer(context: any, playerData: Partial<any> = {}) {
  const uniqueEspnId = playerData.espn_id ?? getUniqueInt();
  const uniqueName = playerData.name ?? `Test Player ${getUniqueValue()}`;
  const data = { name: uniqueName, espn_id: uniqueEspnId, ...playerData };
  let player = await context.db.Player.findMany({ where: { espn_id: { equals: data.espn_id } } });
  if (player.length > 0) return player[0];
  const createdPlayer = await context.db.Player.createOne({ data });
  if (!createdPlayer || !createdPlayer.id) {
    throw new Error(`Failed to create Player in ensurePlayer. Data: ${JSON.stringify(data)}`);
  }
  return createdPlayer;
}

export function sanitizeEspnIdValue(value: any): number {
  return typeof value === 'number' && !isNaN(value) ? value : getUniqueInt();
}

export async function ensureTeam(context: any, teamData: Partial<any> = {}) {
  const uniqueEspnId =
    typeof teamData.espn_id === 'number' && !isNaN(teamData.espn_id)
      ? teamData.espn_id
      : getUniqueInt();
  const uniqueAbbr = teamData.abbreviation ?? `TST${getUniqueValue()}`;
  const uniqueName = teamData.name ?? `Test Team ${getUniqueValue()}`;
  const data = { name: uniqueName, abbreviation: uniqueAbbr, espn_id: uniqueEspnId, ...teamData };
  let team = await context.db.Team.findMany({ where: { abbreviation: { equals: data.abbreviation } } });
  if (team.length > 0) return team[0];
  const createdTeam = await context.db.Team.createOne({ data });
  if (!createdTeam || !createdTeam.id) {
    throw new Error(`Failed to create Team in ensureTeam. Data: ${JSON.stringify(data)}`);
  }
  return createdTeam;
}

export async function ensureUser(context: any, userData: Partial<any> = {}) {
  const uniqueEmail = userData.email ?? `testuser+${getUniqueValue()}@example.com`;
  const uniqueName = userData.name ?? `Test User ${getUniqueValue()}`;
  const data = { name: uniqueName, email: uniqueEmail, password: 'password123', isOwner: true, ...userData };
  let user = await context.db.User.findMany({ where: { email: { equals: data.email } } });
  if (user.length > 0) return user[0];
  const createdUser = await context.db.User.createOne({ data });
  if (!createdUser || !createdUser.id) {
    throw new Error(`Failed to create User in ensureUser. Data: ${JSON.stringify(data)}`);
  }
  return createdUser;
}

export function runAccessControlTests(options: AccessTestOptions) {
  const {
    listKey,
    validCreateData,
    updateData = {},
    sessionScenarios,
    ensureDependencies,
  } = options;

  describe(`${listKey} Access Control`, () => {
    beforeEach(async () => {
      await deleteAllData();
    });

    sessionScenarios.forEach(({ name, session, canCreate, canRead, canUpdate, canDelete }) => {
      it(`${name} - create`, async () => {
        const context = getContext(config, PrismaModule).withSession(session);
        let extraData = {};
        if (ensureDependencies) {
          extraData = await ensureDependencies(context);
        }
        const action = () => context.db[listKey].createOne({ data: { ...validCreateData, ...extraData } });
        if (canCreate) {
          await expect(action()).resolves.toBeDefined();
        } else {
          await expect(action()).rejects.toThrow();
        }
        await context.prisma.$disconnect();
      });

      it(`${name} - read`, async () => {
        const sudo = getContext(config, PrismaModule).sudo();
        let extraData = {};
        if (ensureDependencies) {
          extraData = await ensureDependencies(sudo);
        }
        const created = await sudo.db[listKey].createOne({ data: { ...validCreateData, ...extraData } });
        const context = getContext(config, PrismaModule).withSession(session);
        const result = await context.db[listKey].findMany({});
        if (canRead) {
          expect(result.length).toBeGreaterThan(0);
        } else {
          expect(result.length).toBe(0);
        }
        await Promise.allSettled([
          sudo.prisma.$disconnect(),
          context.prisma.$disconnect()
        ]);
      });

      it(`${name} - update`, async () => {
        const sudo = getContext(config, PrismaModule).sudo();
        let extraData = {};
        if (ensureDependencies) {
          extraData = await ensureDependencies(sudo);
        }
        const created = await sudo.db[listKey].createOne({ data: { ...validCreateData, ...extraData } });
        const context = getContext(config, PrismaModule).withSession(session);
        const action = () => context.db[listKey].updateOne({ where: { id: created.id }, data: updateData });
        if (canUpdate) {
          await expect(action()).resolves.toBeDefined();
        } else {
          await expect(action()).rejects.toThrow();
        }
        await Promise.allSettled([
          sudo.prisma.$disconnect(),
          context.prisma.$disconnect()
        ]);
      });

      it(`${name} - delete`, async () => {
        const sudo = getContext(config, PrismaModule).sudo();
        let extraData = {};
        if (ensureDependencies) {
          extraData = await ensureDependencies(sudo);
        }
        const created = await sudo.db[listKey].createOne({ data: { ...validCreateData, ...extraData } });
        const context = getContext(config, PrismaModule).withSession(session);
        const action = () => context.db[listKey].deleteOne({ where: { id: created.id } });
        if (canDelete) {
          await expect(action()).resolves.toBeDefined();
        } else {
          await expect(action()).rejects.toThrow();
        }
        await Promise.allSettled([
          sudo.prisma.$disconnect(),
          context.prisma.$disconnect()
        ]);
      });
    });
  });
}
