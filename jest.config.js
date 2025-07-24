module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'schema/**/*.ts',
    'utils/**/*.ts',
    'auth.ts',
    '!**/*.d.ts',
  ],
  // setupFilesAfterEnv: ['<rootDir>/test-setup.ts'], // Will add this later
  testTimeout: 60000,
  maxWorkers: 1, // Keystone tests should run sequentially
  setupFiles: ['<rootDir>/jest.env.js'],
};