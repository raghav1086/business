import { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import { readFileSync } from 'fs';

// Read tsconfig.base.json
const tsconfigBase = JSON.parse(readFileSync('./tsconfig.base.json', 'utf8'));

export default {
  displayName: 'e2e-tests',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/e2e/**/*.spec.ts'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.base.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: './coverage/e2e',
  collectCoverageFrom: [
    'tests/e2e/**/*.ts',
    '!tests/e2e/**/*.spec.ts',
  ],
  moduleNameMapper: pathsToModuleNameMapper(tsconfigBase.compilerOptions?.paths || {}, {
    prefix: '<rootDir>/',
  }),
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 60000, // 60 seconds for E2E tests
  maxWorkers: 1, // Run tests sequentially
} as Config;

