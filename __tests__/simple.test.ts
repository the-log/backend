import { getContext } from '@keystone-6/core/context';
import { resetDatabase } from '@keystone-6/core/testing';

describe('Jest Configuration', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to environment variables', () => {
    expect(process.env.DATABASE_TYPE).toBe('sqlite');
    expect(process.env.DATABASE_URL).toBe('file:./test.db?connection_limit=1');
  });

  it('should be able to import Keystone modules', () => {
    expect(typeof getContext).toBe('function');
    expect(typeof resetDatabase).toBe('function');
  });
});