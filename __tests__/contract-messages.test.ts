import {
  buildContractEvent,
  formatEventForDiscord,
  formatMoney,
  formatYears,
  ContractData,
  ContractParties,
} from '../utils/contractMessages';

const bills = { name: 'Bills', abbreviation: 'BUF' };
const chiefs = { name: 'Chiefs', abbreviation: 'KC' };

const parties = (overrides: Partial<ContractParties> = {}): ContractParties => ({
  player: { name: 'Justin Jefferson', position: 'WR' },
  team: bills,
  previousTeam: null,
  ...overrides,
});

const contract = (overrides: Partial<ContractData> = {}): ContractData => ({
  id: 'contract1',
  salary: 4500,
  years: 3,
  status: 'active',
  teamId: 'team1',
  playerId: 'player1',
  needsAttention: false,
  isFranchiseTagged: false,
  ...overrides,
});

describe('formatMoney', () => {
  it('renders cents as dollars', () => {
    expect(formatMoney(12345)).toBe('$123.45');
    expect(formatMoney(100)).toBe('$1.00');
    expect(formatMoney(123456789)).toBe('$1,234,567.89');
  });

  it('falls back to zero for missing values', () => {
    expect(formatMoney(null)).toBe('$0.00');
    expect(formatMoney(undefined)).toBe('$0.00');
  });
});

describe('formatYears', () => {
  it('pluralizes', () => {
    expect(formatYears(1)).toBe('1 yr');
    expect(formatYears(3)).toBe('3 yrs');
    expect(formatYears(0)).toBe('0 yrs');
  });
});

describe('buildContractEvent', () => {
  it('describes a signing', () => {
    const event = buildContractEvent(null, contract(), parties());

    expect(event.type).toBe('signed');
    expect(event.message).toBe(
      'Bills signed Justin Jefferson (WR) to a $45.00 / 3 yrs contract'
    );
  });

  it('notes a non-active status on a signing', () => {
    const event = buildContractEvent(null, contract({ status: 'dts' }), parties());

    expect(event.message).toBe(
      'Bills signed Justin Jefferson (WR) to a $45.00 / 3 yrs contract (DTS)'
    );
  });

  it('describes a termination', () => {
    const event = buildContractEvent(contract(), null, parties());

    expect(event.type).toBe('terminated');
    expect(event.message).toBe(
      "Bills terminated Justin Jefferson (WR)'s $45.00 / 3 yrs contract"
    );
  });

  it('describes each status destination', () => {
    const cases: Array<[ContractData['status'], string]> = [
      ['dts', 'moved to DTS (from Active Roster)'],
      ['ir', 'placed on Injured Reserve (from Active Roster)'],
      ['waived', 'placed on Waivers (from Active Roster)'],
      ['rfa', 'became a Restricted Free Agent (from Active Roster)'],
    ];

    for (const [status, clause] of cases) {
      const event = buildContractEvent(contract(), contract({ status }), parties());

      expect(event.type).toBe('status_change');
      expect(event.message).toBe(
        `Justin Jefferson (WR, Bills): ${clause}. Contract: $45.00 / 3 yrs`
      );
    }
  });

  it('describes activation off injured reserve', () => {
    const event = buildContractEvent(
      contract({ status: 'ir' }),
      contract({ status: 'active' }),
      parties()
    );

    expect(event.message).toBe(
      'Justin Jefferson (WR, Bills): activated to the Active Roster (from Injured Reserve). Contract: $45.00 / 3 yrs'
    );
  });

  it('names both teams on a team change without repeating the new team', () => {
    const event = buildContractEvent(
      contract(),
      contract({ teamId: 'team2' }),
      parties({ team: chiefs, previousTeam: bills })
    );

    expect(event.type).toBe('team_change');
    expect(event.message).toBe(
      'Justin Jefferson (WR): moved from Bills to Chiefs. Contract: $45.00 / 3 yrs'
    );
  });

  it('states salary movement in dollars', () => {
    const raise = buildContractEvent(contract(), contract({ salary: 4950 }), parties());
    expect(raise.type).toBe('salary_change');
    expect(raise.message).toBe(
      'Justin Jefferson (WR, Bills): salary raised from $45.00 to $49.50'
    );

    const cut = buildContractEvent(contract(), contract({ salary: 2000 }), parties());
    expect(cut.message).toBe(
      'Justin Jefferson (WR, Bills): salary reduced from $45.00 to $20.00'
    );
  });

  it('states contract length changes', () => {
    const event = buildContractEvent(contract(), contract({ years: 2 }), parties());

    expect(event.type).toBe('term_change');
    expect(event.message).toBe(
      'Justin Jefferson (WR, Bills): contract length changed from 3 yrs to 2 yrs'
    );
  });

  it('describes franchise tag and attention flags', () => {
    const tagged = buildContractEvent(
      contract(),
      contract({ isFranchiseTagged: true }),
      parties()
    );
    expect(tagged.type).toBe('franchise_tag');
    expect(tagged.message).toBe(
      'Justin Jefferson (WR, Bills): franchise tagged. Contract: $45.00 / 3 yrs'
    );

    const flagged = buildContractEvent(
      contract(),
      contract({ needsAttention: true }),
      parties()
    );
    expect(flagged.type).toBe('flagged');
    expect(flagged.message).toBe(
      'Justin Jefferson (WR, Bills): flagged as needing attention. Contract: $45.00 / 3 yrs'
    );
  });

  it('combines multiple changes into one message', () => {
    const event = buildContractEvent(
      contract(),
      contract({ status: 'ir', salary: 5000, years: 2 }),
      parties()
    );

    expect(event.type).toBe('status_change');
    expect(event.message).toBe(
      'Justin Jefferson (WR, Bills): placed on Injured Reserve (from Active Roster); salary raised from $45.00 to $50.00; contract length changed from 3 yrs to 2 yrs'
    );
  });

  it('handles a no-op update', () => {
    const event = buildContractEvent(contract(), contract(), parties());

    expect(event.type).toBe('updated');
    expect(event.message).toBe(
      'Justin Jefferson (WR, Bills) contract was saved with no field changes'
    );
  });

  it('degrades gracefully when names are missing', () => {
    const event = buildContractEvent(null, contract(), {
      player: null,
      team: null,
      previousTeam: null,
    });

    expect(event.message).toBe('An unknown player signed a $45.00 / 3 yrs contract');
  });

  it('falls back to a team abbreviation when the name is empty', () => {
    const event = buildContractEvent(null, contract(), {
      player: { name: 'Justin Jefferson', position: null },
      team: { name: null, abbreviation: 'BUF' },
      previousTeam: null,
    });

    expect(event.message).toBe('BUF signed Justin Jefferson to a $45.00 / 3 yrs contract');
  });
});

describe('formatEventForDiscord', () => {
  it('prefixes an emoji for the event type', () => {
    expect(formatEventForDiscord({ type: 'signed', message: 'a signing' })).toBe(
      '✍️ a signing'
    );
    expect(formatEventForDiscord({ type: 'terminated', message: 'a cut' })).toBe(
      '✂️ a cut'
    );
  });
});
