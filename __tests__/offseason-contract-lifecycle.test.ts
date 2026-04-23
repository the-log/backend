import { setupAdminContext } from '../test-setup';
import { KeystoneContext } from '@keystone-6/core/types';
import {
  deleteWaivedContracts,
  restoreInjuredReserve,
  decrementContractYears,
  setRFAContracts,
  yearlyRaises,
} from '../scripts/offseason';

let espnIdCounter = 1;
const nextEspnId = () => espnIdCounter++;

// Anchor contracts: specific edge-case rows we assert against as they flow
// through the offseason pipeline. Each is chosen to exercise a distinct branch
// across the five functions under test.
//
//   waived          — deleted in step 1
//   ir              — flipped to active in step 2, then decremented in step 3, then raised in step 5
//   activeStable    — years 3 → 2 in step 3; stays active; gets the 10% raise in step 5
//   activeExpiring  — years 1 → 0 in step 3, then flipped to rfa in step 4
//   activeZero      — years 0 clamped at 0 in step 3, then flipped to rfa in step 4
//   dtsOne          — years 1 → 0 in step 3; NOT flipped to rfa (step 4 only targets active); NOT raised
//   rfaStable       — untouched by every step
const ANCHOR_SPECS = [
  { label: 'waived',         status: 'waived', years: 2, salary: 5000 },
  { label: 'ir',             status: 'ir',     years: 2, salary: 5000 },
  { label: 'activeStable',   status: 'active', years: 3, salary: 1000 },
  { label: 'activeExpiring', status: 'active', years: 1, salary: 1000 },
  { label: 'activeZero',     status: 'active', years: 0, salary: 1000 },
  { label: 'dtsOne',         status: 'dts',    years: 1, salary: 500 },
  { label: 'rfaStable',      status: 'rfa',    years: 2, salary: 500 },
] as const;

// Cycled across bulk noise contracts to give every function a realistic number
// of rows to churn through.
const BULK_STATUS_CYCLE = [
  'active', 'active', 'active', 'active', 'active',
  'dts', 'dts', 'ir', 'waived', 'rfa',
];

async function seedLeague(
  context: KeystoneContext,
  { teams: teamCount = 10, contractsPerTeam = 15 } = {},
) {
  const teamData = Array.from({ length: teamCount }, (_, i) => ({
    espn_id: nextEspnId(),
    name: `Team ${i}`,
    abbreviation: `T${i}`,
  }));
  const createdTeams = (await context.query.Team.createMany({
    data: teamData,
    query: 'id',
  })) as any[];

  type Spec = { status: string; years: number; salary: number; teamIdx: number };
  const specs: Spec[] = ANCHOR_SPECS.map((s) => ({
    status: s.status,
    years: s.years,
    salary: s.salary,
    teamIdx: 0,
  }));
  for (let t = 0; t < teamCount; t++) {
    const startIdx = t === 0 ? ANCHOR_SPECS.length : 0;
    for (let c = startIdx; c < contractsPerTeam; c++) {
      specs.push({
        status: BULK_STATUS_CYCLE[c % BULK_STATUS_CYCLE.length],
        years: (c % 5) + 1,
        salary: 1000 + c * 100,
        teamIdx: t,
      });
    }
  }

  const players = (await context.query.Player.createMany({
    data: specs.map((_, i) => ({
      espn_id: nextEspnId(),
      name: `Player-${i}`,
      position: 'QB',
    })),
    query: 'id',
  })) as any[];

  const contracts = (await context.query.Contract.createMany({
    data: specs.map((s, i) => ({
      status: s.status,
      years: s.years,
      salary: s.salary,
      team: { connect: { id: createdTeams[s.teamIdx].id } },
      player: { connect: { id: players[i].id } },
    })),
    query: 'id status years salary',
  })) as any[];

  const anchors: Record<string, { id: string; status: string; years: number; salary: number }> = {};
  ANCHOR_SPECS.forEach((s, i) => {
    anchors[s.label] = contracts[i];
  });

  return { anchors, contractCount: contracts.length };
}

async function findContract(context: KeystoneContext, id: string) {
  return (await context.query.Contract.findOne({
    where: { id },
    query: 'id status years salary',
  })) as { id: string; status: string; years: number; salary: number } | null;
}

async function countByStatus(context: KeystoneContext, status: string) {
  return context.query.Contract.count({
    where: { status: { equals: status } },
  });
}

describe('Offseason contract lifecycle pipeline', () => {
  it('mutates seeded league state through delete → restore → decrement → rfa → raises', async () => {
    espnIdCounter = 1;
    const context = await setupAdminContext();
    const { anchors, contractCount } = await seedLeague(context);

    // --- Step 1: deleteWaivedContracts ---
    expect(await countByStatus(context, 'waived')).toBeGreaterThan(0);

    await deleteWaivedContracts();

    expect(await countByStatus(context, 'waived')).toBe(0);
    expect(await findContract(context, anchors.waived.id)).toBeNull();
    expect(await findContract(context, anchors.ir.id)).not.toBeNull();
    expect(await findContract(context, anchors.activeStable.id)).not.toBeNull();

    // --- Step 2: restoreInjuredReserve ---
    expect(await countByStatus(context, 'ir')).toBeGreaterThan(0);

    await restoreInjuredReserve();

    expect(await countByStatus(context, 'ir')).toBe(0);
    const irAfter = await findContract(context, anchors.ir.id);
    expect(irAfter!.status).toBe('active');
    expect(irAfter!.years).toBe(2); // years preserved through the flip

    // --- Step 3: decrementContractYears ---
    await decrementContractYears();

    expect((await findContract(context, anchors.activeStable.id))!.years).toBe(2);   // 3 → 2
    expect((await findContract(context, anchors.activeExpiring.id))!.years).toBe(0); // 1 → 0
    expect((await findContract(context, anchors.activeZero.id))!.years).toBe(0);     // 0 → clamped 0
    expect((await findContract(context, anchors.dtsOne.id))!.years).toBe(0);         // 1 → 0
    expect((await findContract(context, anchors.ir.id))!.years).toBe(1);             // now active (step 2), 2 → 1
    expect((await findContract(context, anchors.rfaStable.id))!.years).toBe(2);      // rfa untouched

    // --- Step 4: setRFAContracts ---
    await setRFAContracts();

    expect((await findContract(context, anchors.activeExpiring.id))!.status).toBe('rfa');  // active, years 0 → rfa
    expect((await findContract(context, anchors.activeZero.id))!.status).toBe('rfa');      // active, years 0 → rfa
    expect((await findContract(context, anchors.activeStable.id))!.status).toBe('active'); // active, years 2 — untouched
    expect((await findContract(context, anchors.ir.id))!.status).toBe('active');           // active, years 1 — untouched
    expect((await findContract(context, anchors.dtsOne.id))!.status).toBe('dts');          // dts with years 0 NOT flipped

    // --- Step 5: yearlyRaises ---
    await yearlyRaises();

    expect((await findContract(context, anchors.activeStable.id))!.salary).toBe(1100);   // 1000 × 1.1
    expect((await findContract(context, anchors.ir.id))!.salary).toBe(5500);             // 5000 × 1.1
    expect((await findContract(context, anchors.activeExpiring.id))!.salary).toBe(1000); // now rfa, unchanged
    expect((await findContract(context, anchors.activeZero.id))!.salary).toBe(1000);     // now rfa, unchanged
    expect((await findContract(context, anchors.dtsOne.id))!.salary).toBe(500);          // dts, unchanged
    expect((await findContract(context, anchors.rfaStable.id))!.salary).toBe(500);       // rfa, unchanged

    // End state sanity: only waived contracts were removed; everything else survived.
    const finalCount = await context.query.Contract.count({});
    expect(finalCount).toBeLessThan(contractCount);
    expect(finalCount).toBeGreaterThan(0);
  });
});
