import { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import { readFileSync } from 'fs';

// Read tsconfig.base.json
const tsconfigBase = JSON.parse(readFileSync('./tsconfig.base.json', 'utf8'));

export default {
  displayName: 'integration-tests',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/integration/**/*.spec.ts'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.base.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: './coverage/integration',
  collectCoverageFrom: [
    'tests/integration/**/*.ts',
    '!tests/integration/**/*.spec.ts',
  ],
  moduleNameMapper: pathsToModuleNameMapper(tsconfigBase.compilerOptions?.paths || {}, {
    prefix: '<rootDir>/',
  }),
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000, // 30 seconds for integration tests
  maxWorkers: 1, // Run tests sequentially to avoid DB conflicts
} as Config;

