import { getContext } from '@keystone-6/core/context';
import config from '../keystone';
import * as PrismaModule from '@prisma/client';
import { deleteAllData, ensurePlayer, ensureTeam, ensureUser, runAccessControlTests } from './testUtils';
import { inspect } from 'util';

runAccessControlTests({
  listKey: 'Contract',
  validCreateData: { salary: 1000, years: 1, status: 'active' },
  updateData: { salary: 2000 },
  sessionScenarios: [
    { name: 'Admin', session: { data: { isAdmin: true } }, canCreate: true, canRead: true, canUpdate: true, canDelete: true },
    { name: 'Non-admin', session: { data: { isAdmin: false } }, canCreate: false, canRead: true, canUpdate: false, canDelete: false },
    { name: 'Unauthenticated', session: false, canCreate: false, canRead: false, canUpdate: false, canDelete: false }
  ],
  ensureDependencies: async () => {
    const sudo = getContext(config, PrismaModule).sudo();
    const player = await ensurePlayer(sudo);
    const team = await ensureTeam(sudo);
    return {
      player: { connect: { id: player.id } },
      team: { connect: { id: team.id } }
    };
  }
});

describe('Contract Status Transitions By Owners', () => {
  let sudo: any, owner: any, contract: any;

  beforeEach(async () => {
    await deleteAllData();

    sudo = getContext(config, PrismaModule).sudo();
    await ensureUser(sudo, { name: 'Admin', email: 'admin@example.com' });
    const user = await ensureUser(sudo);
    const player = await ensurePlayer(sudo);
    const team = await ensureTeam(sudo, { owner: { connect: { id: user.id } } });
    contract = await sudo.db.Contract.createOne({
      data: {
        player: { connect: { id: player.id } },
        team: { connect: { id: team.id } },
        salary: 1000,
        years: 1,
        status: 'active'
      }
    });

    // Get owner context
    owner = getContext(config, PrismaModule).withSession({
      data: {
        ...user,
        team: {
          id: team.id
        }
      }
    });
  });

  afterEach(async () => {
    await Promise.allSettled([
      sudo.prisma.$disconnect(),
      owner.prisma.$disconnect()
    ])
  })

  // DTS Transitions
  it('DTS -> Active is allowed', async () => {
    await sudo.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'dts' }
    });
    const result = await owner.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'active' }
    });
    expect(result).toBeDefined();
    expect(result?.status).toBe('active');
  });

  it('DTS -> Waived is allowed', async () => {
    await sudo.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'dts' }
    });
    const result = await owner.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'waived' }
    });
    expect(result).toBeDefined();
    expect(result?.status).toBe('waived');
  });

  it('DTS -> IR is not allowed', async () => {
    await sudo.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'dts' }
    });
    await expect(owner.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'ir' }
    })).rejects.toThrow();
  });

  it('DTS -> RFA is not allowed', async () => {
    await sudo.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'dts' }
    });
    await expect(owner.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'rfa' }
    })).rejects.toThrow();
  });

  // Active Transitions
  it('Active -> DTS is not allowed', async () => {
    await sudo.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'active' }
    });
    await expect(owner.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'dts' }
    })).rejects.toThrow();
  });

  it('Active -> IR is allowed', async () => {
    await sudo.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'active' }
    });
    const result = await owner.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'ir' }
    });
    expect(result).toBeDefined();
    expect(result?.status).toBe('ir');
  });

  it('Active -> Waived is allowed', async () => {
    await sudo.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'active' }
    });
    const result = await owner.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'waived' }
    });
    expect(result).toBeDefined();
    expect(result?.status).toBe('waived');
  });

  it('Active -> RFA is not allowed', async () => {
    await sudo.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'active' }
    });
    await expect(owner.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'rfa' }
    })).rejects.toThrow();
  });

  // IR Transitions
  it('IR -> DTS is not allowed', async () => {
    await sudo.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'ir' }
    });
    await expect(owner.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'dts' }
    })).rejects.toThrow();
  });

  it('IR -> Active is not allowed', async () => {
    await sudo.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'ir' }
    });
    await expect(owner.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'active' }
    })).rejects.toThrow();
  });

  it('IR -> Waived is allowed', async () => {
    await sudo.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'ir' }
    });
    const result = await owner.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'waived' }
    });
    expect(result).toBeDefined();
    expect(result?.status).toBe('waived');
  });

  it('IR -> RFA is not allowed', async () => {
    await sudo.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'ir' }
    });
    await expect(owner.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'rfa' }
    })).rejects.toThrow();
  });

  // Waived Transitions
  it('Waived -> DTS is not allowed', async () => {
    await sudo.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'waived' }
    });
    await expect(owner.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'dts' }
    })).rejects.toThrow();
  });

  it('Waived -> Active is not allowed', async () => {
    await sudo.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'waived' }
    });
    await expect(owner.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'active' }
    })).rejects.toThrow();
  });

  it('Waived -> IR is not allowed', async () => {
    await sudo.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'waived' }
    });
    await expect(owner.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'ir' }
    })).rejects.toThrow();
  });

  it('Waived -> RFA is not allowed', async () => {
    await sudo.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'waived' }
    });
    await expect(owner.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'rfa' }
    })).rejects.toThrow();
  });

  // RFA Transitions
  it('RFA -> DTS is not allowed', async () => {
    await sudo.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'rfa' }
    });
    await expect(owner.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'dts' }
    })).rejects.toThrow();
  });

  it('RFA -> Active is not allowed', async () => {
    await sudo.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'rfa' }
    });
    await expect(owner.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'active' }
    })).rejects.toThrow();
  });

  it('RFA -> IR is not allowed', async () => {
    await sudo.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'rfa' }
    });
    await expect(owner.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'ir' }
    })).rejects.toThrow();
  });

  it('RFA -> Waived is not allowed', async () => {
    await sudo.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'rfa' }
    });
    await expect(owner.db.Contract.updateOne({
      where: { id: contract.id },
      data: { status: 'waived' }
    })).rejects.toThrow();
  });
});
