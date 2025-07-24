import { bidAccess, contractAccess, userAccess } from '../utils/access';

describe('Access Control', () => {
  describe('bidAccess', () => {
    it('should allow owners to query bids', () => {
      const session = { data: { isOwner: true } };
      const result = bidAccess.operation?.query?.({ session });
      expect(result).toBe(true);
    });

    it('should deny non-owners from querying bids', () => {
      const session = { data: { isOwner: false } };
      const result = bidAccess.operation?.query?.({ session });
      expect(result).toBe(false);
    });

    it('should filter bids correctly for team owners', () => {
      const session = { 
        data: { 
          isAdmin: false, 
          team: { id: 'team123' } 
        } 
      };
      const context = { 
        req: { 
          headers: { 
            origin: 'https://app.log.football' 
          } 
        } 
      };
      
      const result = bidAccess.filter?.query?.({ session, context });
      
      expect(result).toEqual({
        OR: [
          {
            team: {
              id: {
                equals: 'team123'
              }
            }
          },
          {
            locked: {
              not: null
            }
          }
        ]
      });
    });

    it('should allow admin backend access to all bids', () => {
      const session = { 
        data: { 
          isAdmin: true, 
          team: { id: 'team123' } 
        } 
      };
      const context = { 
        req: { 
          headers: { 
            origin: 'https://api.log.football' 
          } 
        } 
      };
      
      const result = bidAccess.filter?.query?.({ session, context });
      expect(result).toEqual({});
    });
  });

  describe('contractAccess', () => {
    it('should allow authenticated users to query contracts', () => {
      const session = { data: { id: 'user123' } };
      const result = contractAccess.operation?.query?.({ session });
      expect(result).toBe(true);
    });

    it('should deny unauthenticated users from querying contracts', () => {
      const session = null;
      const result = contractAccess.operation?.query?.({ session });
      expect(result).toBe(false);
    });

    it('should allow team owners to update their own contracts', () => {
      const session = { 
        data: { 
          isAdmin: false, 
          team: { id: 'team123' } 
        } 
      };
      const item = { teamId: 'team123' };
      
      const result = contractAccess.item?.update?.({ session, item });
      expect(result).toBe(true);
    });

    it('should allow admins to update any contract', () => {
      const session = { 
        data: { 
          isAdmin: true, 
          team: { id: 'team123' } 
        } 
      };
      const item = { teamId: 'team456' };
      
      const result = contractAccess.item?.update?.({ session, item });
      expect(result).toBe(true);
    });
  });

  describe('userAccess', () => {
    it('should allow users to update their own profile', () => {
      const session = { 
        itemId: 'user123', 
        data: { isAdmin: false } 
      };
      const item = { id: 'user123' };
      
      const result = userAccess.item?.update?.({ session, item });
      expect(result).toBe(true);
    });

    it('should deny users from updating other profiles', () => {
      const session = { 
        itemId: 'user123', 
        data: { isAdmin: false } 
      };
      const item = { id: 'user456' };
      
      const result = userAccess.item?.update?.({ session, item });
      expect(result).toBe(false);
    });

    it('should allow admins to update any user', () => {
      const session = { 
        itemId: 'user123', 
        data: { isAdmin: true } 
      };
      const item = { id: 'user456' };
      
      const result = userAccess.item?.update?.({ session, item });
      expect(result).toBe(true);
    });
  });
});