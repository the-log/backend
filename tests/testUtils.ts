// backend/tests/testUtils.ts
import { getContext } from '@keystone-6/core/context';
import config from '../keystone';
import * as PrismaModule from '@prisma/client';
import keystone from '../keystone';

// Get all list keys programmatically
const listKeys = Object.keys(config.lists);

export async function deleteAllData() {
  const sudo = getContext(config, PrismaModule).sudo();
  for (const listKey of listKeys) {
    if (sudo.db[listKey]) {
      const items = await sudo.db[listKey].findMany({}).catch(() => []);
      for (const item of items) {
        await sudo.db[listKey].deleteOne({ where: { id: item.id } });
      }
    }
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
  const defaults = { name: 'Test Player', espn_id: 1 };
  const data = { ...defaults, ...playerData };
  let player = await context.db.Player.findMany({ where: { espn_id: { equals: data.espn_id } } });
  if (player.length > 0) return player[0];
  return await context.db.Player.createOne({ data });
}

export async function ensureTeam(context: any, teamData: Partial<any> = {}) {
  const defaults = { name: 'Test Team', abbreviation: 'TST', espn_id: 1 };
  const data = { ...defaults, ...teamData };
  let team = await context.db.Team.findMany({ where: { abbreviation: { equals: data.abbreviation } } });
  if (team.length > 0) return team[0];
  return await context.db.Team.createOne({ data });
}

export async function ensureUser(context: any, userData: Partial<any> = {}) {
  const defaults = { name: 'Test User', email: 'testuser@example.com', password: 'password123', isOwner: true };
  const data = { ...defaults, ...userData };
  let user = await context.db.User.findMany({ where: { email: { equals: data.email } } });
  if (user.length > 0) return user[0];
  return await context.db.User.createOne({ data });
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
        ])
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
        ])
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
        ])
      });
    });
  });
}
