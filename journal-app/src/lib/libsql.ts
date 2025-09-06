import { createClient } from '@libsql/client';

// Following official Turso + Next.js docs pattern
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
});

export default client