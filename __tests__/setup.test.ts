// Basic test to verify Jest configuration
describe('Jest Configuration', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to environment variables', () => {
    expect(process.env.DATABASE_TYPE).toBe('sqlite');
    expect(process.env.DATABASE_URL).toBe('file:./test.db');
  });

  it('should be able to import Keystone modules', async () => {
    const { getContext } = await import('@keystone-6/core/context');
    const { resetDatabase } = await import('@keystone-6/core/testing');
    
    expect(typeof getContext).toBe('function');
    expect(typeof resetDatabase).toBe('function');
  });
});