/* global module */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true
      }
    ]
  },
  extensionsToTreatAsEsm: ['.ts'],
  testRegex: '(/__tests__/.*\\.spec\\.ts$|(\\.|/)(spec)\\.ts$)', // Match .spec.ts files only
  moduleNameMapper: {
    // Map TypeScript path aliases
    '^src/(.*)$': '<rootDir>/src/$1',
    // Correctly map ESM imports
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
}
