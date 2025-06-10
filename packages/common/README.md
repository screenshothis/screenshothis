# common

This package provides shared type definitions and configurations for API key rate limiting.

## Exports

- `keyLimits`: Configuration for different subscription plans and their rate limit settings
- `Limit`: TypeScript type defining the structure of rate limit settings

## Usage Example

```ts
import { keyLimits, Limit } from '@screenshothis/common';

// Access rate limits for a specific plan
const freePlanLimits = keyLimits.free;

// Example of working with the Limit type
const customLimit: Limit = {
    rateLimitMax: 100,
}
```

To install dependencies:

```bash
pnpm install
```

To run:

```bash
pnpm run index.ts
```

This project was created using `pnpm init`. [pnpm](https://pnpm.io) is a fast, disk space efficient package manager.
