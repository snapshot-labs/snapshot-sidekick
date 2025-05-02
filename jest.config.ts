/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

export default {
  clearMocks: true,
  collectCoverage: true,
  coverageThreshold: {
    global: {
      lines: 50
    }
  },
  collectCoverageFrom: ['./src/**'],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: ['/node_modules/', '<rootDir>/dist/', '<rootDir>/test/fixtures/'],

  preset: 'ts-jest',
  testEnvironment: 'jest-environment-node-single-context',
  setupFiles: ['dotenv/config'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  moduleFileExtensions: ['js', 'ts'],
  testPathIgnorePatterns: ['dist/'],
  verbose: true
};
