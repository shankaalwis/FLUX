# Testing Setup Guide

## Install Testing Dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

## Add to package.json scripts:

```json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}
```

## Create vitest.config.ts:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

## Priority Tests to Write:

1. **Authentication Flow** (`src/hooks/useAuth.test.tsx`)
2. **Transaction Calculations** (`src/pages/Dashboard.test.tsx`)
3. **PDF Processing** (`src/utils/pdf-extractor.test.ts`)
4. **Error Handling** (`src/lib/error-handler.test.ts`)
5. **Component Rendering** (UI components)

## Example Test:

```typescript
// src/lib/error-handler.test.ts
import { describe, it, expect } from 'vitest';
import { getErrorMessage, handleError } from './error-handler';

describe('Error Handler', () => {
  it('should extract message from Error object', () => {
    const error = new Error('Test error');
    expect(getErrorMessage(error)).toBe('Test error');
  });

  it('should handle string errors', () => {
    expect(getErrorMessage('String error')).toBe('String error');
  });

  it('should return default message for unknown types', () => {
    expect(getErrorMessage(null)).toBe('An unexpected error occurred');
  });
});
```
