import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['server/**/*.ts', 'client/src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules',
        'dist',
        'test',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/types.ts',
        'client/src/main.tsx',
        'client/src/components/ui/**',
        'client/src/components/examples/**',
        'client/src/components/**', // Exclude UI components - use E2E testing instead
        'client/src/pages/**', // Exclude page components - use E2E testing instead
        'client/src/hooks/**', // Exclude hooks - test through components
        'client/src/lib/utils.ts', // Simple utility wrappers
        'client/src/lib/queryClient.ts', // React Query config
        'server/vite.ts',
        'server/index.ts',
        'server/storage.ts', // Simple file operations
      ],
      all: true,
      // Realistic thresholds focused on business logic
      lines: 40,
      functions: 40,
      branches: 40,
      statements: 40,
      thresholds: {
        // Higher thresholds for critical server code
        'server/routes.ts': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
        'server/security.ts': {
          lines: 60,
          functions: 50,
          branches: 57,
          statements: 59,
        },
        'server/env-validator.ts': {
          lines: 77,
          functions: 80,
          branches: 50,
          statements: 75,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});
