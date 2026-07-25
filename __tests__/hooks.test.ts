import { contractHooks as contractHooksRaw } from '../utils/hooks';
import { flushDiscord } from '../utils/discord';

const contractHooks = contractHooksRaw as any;

const player = { name: 'Justin Jefferson', position: 'WR' };
const bills = { name: 'Bills', abbreviation: 'BUF' };
const chiefs = { name: 'Chiefs', abbreviation: 'KC' };

const buildContext = () => {
  const createOneMock = jest.fn();
  const playerFindOne = jest.fn().mockResolvedValue(player);
  const teamFindOne = jest.fn().mockImplementation(({ where }: any) =>
    Promise.resolve(where.id === 'team456' ? chiefs : bills)
  );

  const context: any = {
    session: { itemId: 'user123' },
    sudo: () => ({
      query: {
        ContractLogEntry: { createOne: createOneMock },
        Player: { findOne: playerFindOne },
        Team: { findOne: teamFindOne },
      },
    }),
  };

  return { context, createOneMock, playerFindOne, teamFindOne };
};

const baseContract = {
  id: 'contract123',
  salary: 4500,
  years: 3,
  status: 'active',
  teamId: 'team123',
  playerId: 'player123',
  needsAttention: false,
  isFranchiseTagged: false,
};

describe('Contract Hooks', () => {
  describe('afterOperation', () => {
    it('should create log entry for new contract', async () => {
      const { context, createOneMock } = buildContext();

      await contractHooks.afterOperation({
        operation: 'create',
        originalItem: null,
        item: baseContract,
        context,
      });

      expect(createOneMock).toHaveBeenCalledWith({
        data: {
          contract: { connect: { id: 'contract123' } },
          player: { connect: { id: 'player123' } },
          team: { connect: { id: 'team123' } },
          user: { connect: { id: 'user123' } },
          message: 'Bills signed Justin Jefferson (WR) to a $45.00 / 3 yrs contract',
          oldValues: null,
          newValues: baseContract,
        },
      });
    });

    it('should create log entry for status change', async () => {
      const { context, createOneMock } = buildContext();
      const item = { ...baseContract, status: 'dts' };

      await contractHooks.afterOperation({
        operation: 'update',
        originalItem: baseContract,
        item,
        context,
      });

      expect(createOneMock).toHaveBeenCalledWith({
        data: {
          contract: { connect: { id: 'contract123' } },
          player: { connect: { id: 'player123' } },
          team: { connect: { id: 'team123' } },
          user: { connect: { id: 'user123' } },
          message:
            'Justin Jefferson (WR, Bills): moved to DTS (from Active Roster). Contract: $45.00 / 3 yrs',
          oldValues: baseContract,
          newValues: item,
        },
      });
    });

    it('should name both teams when a contract changes hands', async () => {
      const { context, createOneMock, teamFindOne } = buildContext();
      const item = { ...baseContract, teamId: 'team456' };

      await contractHooks.afterOperation({
        operation: 'update',
        originalItem: baseContract,
        item,
        context,
      });

      expect(teamFindOne).toHaveBeenCalledTimes(2);
      expect(createOneMock.mock.calls[0][0].data.message).toBe(
        'Justin Jefferson (WR): moved from Bills to Chiefs. Contract: $45.00 / 3 yrs'
      );
    });

    it('should handle contract deletion', async () => {
      const { context, createOneMock } = buildContext();

      await contractHooks.afterOperation({
        operation: 'delete',
        originalItem: baseContract,
        item: null,
        context,
      });

      expect(createOneMock).toHaveBeenCalledWith({
        data: {
          contract: null,
          player: { connect: { id: 'player123' } },
          team: { connect: { id: 'team123' } },
          user: { connect: { id: 'user123' } },
          message: "Bills terminated Justin Jefferson (WR)'s $45.00 / 3 yrs contract",
          oldValues: baseContract,
          newValues: null,
        },
      });
    });

    it('should still log when the player lookup fails', async () => {
      const { context, createOneMock } = buildContext();
      const errorContext: any = {
        ...context,
        sudo: () => ({
          query: {
            ContractLogEntry: { createOne: createOneMock },
            Player: { findOne: jest.fn().mockRejectedValue(new Error('gone')) },
            Team: { findOne: jest.fn().mockResolvedValue(bills) },
          },
        }),
      };

      await contractHooks.afterOperation({
        operation: 'create',
        originalItem: null,
        item: baseContract,
        context: errorContext,
      });

      expect(createOneMock.mock.calls[0][0].data.message).toBe(
        'Bills signed An unknown player to a $45.00 / 3 yrs contract'
      );
    });

    it('should post the event to Discord', async () => {
      const { context } = buildContext();
      const originalFetch = global.fetch;
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
        text: async () => '',
      });

      global.fetch = mockFetch as any;
      process.env.DISCORD_WEBHOOK_URL = 'https://discord.test/api/webhooks/1/token';

      try {
        await contractHooks.afterOperation({
          operation: 'create',
          originalItem: null,
          item: baseContract,
          context,
        });
        await flushDiscord();

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(JSON.parse(mockFetch.mock.calls[0][1].body).content).toBe(
          '✍️ Bills signed Justin Jefferson (WR) to a $45.00 / 3 yrs contract'
        );
      } finally {
        process.env.DISCORD_WEBHOOK_URL = '';
        global.fetch = originalFetch;
      }
    });

    it('should not post to Discord when no webhook is configured', async () => {
      const { context } = buildContext();
      const originalFetch = global.fetch;
      const mockFetch = jest.fn();
      global.fetch = mockFetch as any;

      try {
        await contractHooks.afterOperation({
          operation: 'create',
          originalItem: null,
          item: baseContract,
          context,
        });
        await flushDiscord();

        expect(mockFetch).not.toHaveBeenCalled();
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should log without a user when there is no session', async () => {
      const { context, createOneMock } = buildContext();
      const sessionless = { ...context, session: undefined };

      await contractHooks.afterOperation({
        operation: 'create',
        originalItem: null,
        item: baseContract,
        context: sessionless,
      });

      expect(createOneMock.mock.calls[0][0].data.user).toBeNull();
    });
  });
});
