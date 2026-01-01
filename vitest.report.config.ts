import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/helpers/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '**/*.config.*',
        '**/*.d.ts',
        'test/**',
        'scripts/**',
      ],
      include: ['server/**/*.ts', 'client/**/*.ts', 'shared/**/*.ts'],
      all: true,
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
        autoUpdate: false,
      },
    },
    reporters: [
      'default',
      'html',
      'json',
      ['junit', { outputFile: './reports/junit.xml' }],
    ],
    outputFile: {
      html: './reports/test-report.html',
      json: './reports/test-results.json',
    },
    benchmark: {
      reporters: ['default', 'json'],
      outputFile: './reports/benchmark-results.json',
    },
    typecheck: {
      enabled: false,
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@server': path.resolve(__dirname, './server'),
      '@client': path.resolve(__dirname, './client'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});
