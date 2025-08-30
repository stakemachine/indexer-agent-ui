# Testing Guide

This project now uses Vitest for testing. Vitest is a fast unit test framework powered by Vite.

## Running Tests

### Command Line
```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm run test:ui
```

### UI Mode
```bash
# Open Vitest UI in browser
pnpm run test:ui
```

This will start a web interface at `http://localhost:51204/__vitest__/` where you can:
- View test results in a visual interface
- See test coverage
- Debug failing tests
- Re-run specific tests

## Test Structure

Tests are located alongside the source files they test:
- `lib/utils.test.ts` - Tests for utility functions
- `components/ui/button.test.tsx` - Tests for the Button component

## Writing Tests

### Unit Tests
For utility functions and business logic:
```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "@/lib/my-module";

describe("myFunction", () => {
  it("should do something", () => {
    expect(myFunction("input")).toBe("expected");
  });
});
```

### Component Tests
For React components:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MyComponent } from "@/components/my-component";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

## Available Testing Utilities

- **Vitest**: Test framework with Jest-compatible API
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers for DOM nodes
- **jsdom**: DOM simulation for Node.js environment

## Configuration

- `vitest.config.ts`: Main Vitest configuration
- `test/setup.ts`: Global test setup (includes jest-dom matchers)
- Path aliases (`@/*`) are configured and work in tests