import { contractHooks } from '../utils/hooks';

// Type guard to check if hooks is an object with afterOperation
function hasAfterOperation(hooks: any): hooks is { afterOperation: Function } {
  return typeof hooks === 'object' && hooks !== null && 'afterOperation' in hooks;
}

describe('Contract Hooks', () => {
  describe('afterOperation', () => {
    it('should create log entry for new contract', async () => {
      const createOneMock = jest.fn();
      const mockContext = {
        session: { itemId: 'user123' },
        sudo: () => ({
          query: {
            ContractLogEntry: {
              createOne: createOneMock
            }
          }
        })
      };

      const item = {
        id: 'contract123',
        salary: 5000,
        years: 2,
        status: 'active',
        teamId: 'team123',
        playerId: 'player123'
      };

      if (hasAfterOperation(contractHooks)) {
        await contractHooks.afterOperation({
          operation: 'create',
          originalItem: null,
          item,
          context: mockContext
        });
      }

      expect(createOneMock).toHaveBeenCalledWith({
        data: {
          contract: { connect: { id: 'contract123' } },
          player: { connect: { id: 'player123' } },
          team: { connect: { id: 'team123' } },
          user: { connect: { id: 'user123' } },
          message: 'New Contract',
          oldValues: null,
          newValues: item
        }
      });
    });

    it('should create log entry for status change', async () => {
      const createOneMock = jest.fn();
      const mockContext = {
        session: { itemId: 'user123' },
        sudo: () => ({
          query: {
            ContractLogEntry: {
              createOne: createOneMock
            }
          }
        })
      };

      const originalItem = {
        id: 'contract123',
        status: 'active',
        teamId: 'team123',
        playerId: 'player123'
      };

      const item = {
        id: 'contract123',
        status: 'dts',
        teamId: 'team123',
        playerId: 'player123'
      };

      if (hasAfterOperation(contractHooks)) {
        await contractHooks.afterOperation({
          operation: 'update',
          originalItem,
          item,
          context: mockContext
        });
      }

      expect(createOneMock).toHaveBeenCalledWith({
        data: {
          contract: { connect: { id: 'contract123' } },
          player: { connect: { id: 'player123' } },
          team: { connect: { id: 'team123' } },
          user: { connect: { id: 'user123' } },
          message: 'To DTS',
          oldValues: originalItem,
          newValues: item
        }
      });
    });

    it('should handle contract deletion', async () => {
      const createOneMock = jest.fn();
      const mockContext = {
        session: { itemId: 'user123' },
        sudo: () => ({
          query: {
            ContractLogEntry: {
              createOne: createOneMock
            }
          }
        })
      };

      const originalItem = {
        id: 'contract123',
        status: 'active',
        teamId: 'team123',
        playerId: 'player123'
      };

      if (hasAfterOperation(contractHooks)) {
        await contractHooks.afterOperation({
          operation: 'delete',
          originalItem,
          item: null,
          context: mockContext
        });
      }

      expect(createOneMock).toHaveBeenCalledWith({
        data: {
          contract: null,
          player: { connect: { id: 'player123' } },
          team: { connect: { id: 'team123' } },
          user: { connect: { id: 'user123' } },
          message: 'Contract Terminated',
          oldValues: originalItem,
          newValues: null
        }
      });
    });
  });
});