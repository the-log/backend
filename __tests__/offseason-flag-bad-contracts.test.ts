import { setupAdminContext } from '../test-setup';
import { KeystoneContext } from '@keystone-6/core/types';
import { flagBadContracts } from '../scripts/offseason';

let espnIdCounter = 1;
const nextEspnId = () => espnIdCounter++;

// Thresholds hard-coded in flagBadContracts (offseason/index.ts:155-164):
//   QB: 32, RB: 40, WR: 50, TE: 20, K: 32, DL: 40, LB: 50, DB: 50
// The check is `positionRank <= threshold` — boundary is inclusive.
//
// Only contracts with status='dts' are evaluated. Flagging rule is either:
//   - years < 1 (zero-year contracts)
//   - player.positionRank <= thresholds[player.position]
// On match, `needsAttention` is set to true.
type Spec = {
  label: string;
  status: string;
  years: number;
  position: string;
  rank: number | null;
};

const SPECS: Spec[] = [
  // Each position: one contract at its threshold (flagged) and one just above (not).
  { label: 'QB-at',    status: 'dts', years: 2, position: 'QB', rank: 32 },
  { label: 'QB-above', status: 'dts', years: 2, position: 'QB', rank: 33 },
  { label: 'RB-at',    status: 'dts', years: 2, position: 'RB', rank: 40 },
  { label: 'RB-above', status: 'dts', years: 2, position: 'RB', rank: 41 },
  { label: 'WR-at',    status: 'dts', years: 2, position: 'WR', rank: 50 },
  { label: 'WR-above', status: 'dts', years: 2, position: 'WR', rank: 51 },
  { label: 'TE-at',    status: 'dts', years: 2, position: 'TE', rank: 20 },
  { label: 'TE-above', status: 'dts', years: 2, position: 'TE', rank: 21 },
  { label: 'K-at',     status: 'dts', years: 2, position: 'K',  rank: 32 },
  { label: 'K-above',  status: 'dts', years: 2, position: 'K',  rank: 33 },
  { label: 'DL-at',    status: 'dts', years: 2, position: 'DL', rank: 40 },
  { label: 'DL-above', status: 'dts', years: 2, position: 'DL', rank: 41 },
  { label: 'LB-at',    status: 'dts', years: 2, position: 'LB', rank: 50 },
  { label: 'LB-above', status: 'dts', years: 2, position: 'LB', rank: 51 },
  { label: 'DB-at',    status: 'dts', years: 2, position: 'DB', rank: 50 },
  { label: 'DB-above', status: 'dts', years: 2, position: 'DB', rank: 51 },

  // 0-year dts: flagged regardless of rank/position.
  { label: 'zeroYear', status: 'dts', years: 0, position: 'QB', rank: 999 },

  // null positionRank: `null <= 32` is true in JS (null coerces to 0 in
  // numeric comparison), so the player ends up flagged. Pinned behavior —
  // if the code ever adds a null guard, this assertion flips.
  { label: 'nullRank', status: 'dts', years: 2, position: 'QB', rank: null },

  // Unknown position ('P' = punter): `thresholds['P']` is undefined, and
  // `rank <= undefined` evaluates to false. Not flagged.
  { label: 'unknownPos', status: 'dts', years: 2, position: 'P', rank: 1 },

  // Non-DTS contract with a dominant rank — the function only queries for
  // status='dts', so this must stay unflagged.
  { label: 'activeGreat', status: 'active', years: 2, position: 'QB', rank: 1 },
];

async function seed(context: KeystoneContext) {
  const team = (await context.query.Team.createOne({
    data: {
      espn_id: nextEspnId(),
      name: 'Flag Test Team',
      abbreviation: 'FLG',
    },
    query: 'id',
  })) as any;

  const players = (await context.query.Player.createMany({
    data: SPECS.map((s) => ({
      espn_id: nextEspnId(),
      name: `Player-${s.label}`,
      position: s.position,
      positionRank: s.rank,
    })),
    query: 'id',
  })) as any[];

  const contracts = (await context.query.Contract.createMany({
    data: SPECS.map((s, i) => ({
      status: s.status,
      years: s.years,
      salary: 1000,
      team: { connect: { id: team.id } },
      player: { connect: { id: players[i].id } },
    })),
    query: 'id',
  })) as any[];

  return Object.fromEntries(SPECS.map((s, i) => [s.label, contracts[i]]));
}

async function attentionFor(context: KeystoneContext, id: string) {
  const c = (await context.query.Contract.findOne({
    where: { id },
    query: 'id needsAttention',
  })) as any;
  return c?.needsAttention;
}

describe('Offseason: flagBadContracts', () => {
  it('flags dts contracts that are zero-year or whose player is at/below position threshold', async () => {
    espnIdCounter = 1;
    const context = await setupAdminContext();
    const seeded = await seed(context);

    await flagBadContracts();

    // Every position's at-threshold contract → flagged (<= is inclusive)
    for (const pos of ['QB', 'RB', 'WR', 'TE', 'K', 'DL', 'LB', 'DB']) {
      expect(await attentionFor(context, seeded[`${pos}-at`].id)).toBe(true);
      expect(await attentionFor(context, seeded[`${pos}-above`].id)).toBe(false);
    }

    // Zero-year dts → flagged regardless of rank/position
    expect(await attentionFor(context, seeded.zeroYear.id)).toBe(true);

    // Pinned: null positionRank ends up flagged (null <= N is true in JS)
    expect(await attentionFor(context, seeded.nullRank.id)).toBe(true);

    // Unknown position → not flagged (thresholds lookup is undefined)
    expect(await attentionFor(context, seeded.unknownPos.id)).toBe(false);

    // Non-DTS contracts are never looked at
    expect(await attentionFor(context, seeded.activeGreat.id)).toBe(false);
  });
});
