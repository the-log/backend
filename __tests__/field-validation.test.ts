import {
  setupAdminContext,
  getAdminContext,
} from '../test-setup';
import { KeystoneContext } from '@keystone-6/core/types';

// Validation bounds fire before any hooks or relationship resolution, so
// rejection tests don't need a real admin user or seeded team/player.
// Acceptance tests for Contract still need setupAdminContext() because the
// afterOperation hook writes a ContractLogEntry that connects to the session
// user. Bid has no such hook, so getAdminContext() works throughout.

describe('Contract field validation', () => {
  async function createContract(
    context: KeystoneContext,
    overrides: Record<string, unknown>,
  ) {
    return context.query.Contract.createOne({
      data: {
        salary: 5000,
        years: 2,
        status: 'active',
        ...overrides,
      },
      query: 'id',
    });
  }

  describe('salary bounds (100 min, 100_000 max)', () => {
    it('rejects salary below min (99)', async () => {
      await expect(createContract(getAdminContext(), { salary: 99 })).rejects.toThrow();
    });

    it('accepts salary at min (100)', async () => {
      const context = await setupAdminContext();
      await expect(createContract(context, { salary: 100 })).resolves.toBeDefined();
    });

    it('accepts salary at max (100_000)', async () => {
      const context = await setupAdminContext();
      await expect(createContract(context, { salary: 100_000 })).resolves.toBeDefined();
    });

    it('rejects salary above max (100_001)', async () => {
      await expect(createContract(getAdminContext(), { salary: 100_001 })).rejects.toThrow();
    });
  });

  describe('years bounds (0 min, 100 max)', () => {
    it('rejects years below min (-1)', async () => {
      await expect(createContract(getAdminContext(), { years: -1 })).rejects.toThrow();
    });

    it('accepts years at min (0)', async () => {
      const context = await setupAdminContext();
      await expect(createContract(context, { years: 0 })).resolves.toBeDefined();
    });

    it('accepts years at max (100)', async () => {
      const context = await setupAdminContext();
      await expect(createContract(context, { years: 100 })).resolves.toBeDefined();
    });

    it('rejects years above max (101)', async () => {
      await expect(createContract(getAdminContext(), { years: 101 })).rejects.toThrow();
    });
  });
});

describe('Bid field validation', () => {
  async function createBid(
    context: KeystoneContext,
    overrides: Record<string, unknown>,
  ) {
    return context.query.Bid.createOne({
      data: {
        salary: 5000,
        years: 2,
        ...overrides,
      },
      query: 'id',
    });
  }

  describe('salary bounds (100 min, 100_000 max)', () => {
    it('rejects salary below min (99)', async () => {
      await expect(createBid(getAdminContext(), { salary: 99 })).rejects.toThrow();
    });

    it('accepts salary at min (100)', async () => {
      await expect(createBid(getAdminContext(), { salary: 100 })).resolves.toBeDefined();
    });

    it('accepts salary at max (100_000)', async () => {
      await expect(createBid(getAdminContext(), { salary: 100_000 })).resolves.toBeDefined();
    });

    it('rejects salary above max (100_001)', async () => {
      await expect(createBid(getAdminContext(), { salary: 100_001 })).rejects.toThrow();
    });
  });

  describe('years bounds (0 min, 100 max)', () => {
    it('rejects years below min (-1)', async () => {
      await expect(createBid(getAdminContext(), { years: -1 })).rejects.toThrow();
    });

    it('accepts years at min (0)', async () => {
      await expect(createBid(getAdminContext(), { years: 0 })).resolves.toBeDefined();
    });

    it('accepts years at max (100)', async () => {
      await expect(createBid(getAdminContext(), { years: 100 })).resolves.toBeDefined();
    });

    it('rejects years above max (101)', async () => {
      await expect(createBid(getAdminContext(), { years: 101 })).rejects.toThrow();
    });
  });
});
