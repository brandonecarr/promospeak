import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { serverEnv } from "@/config/env";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  var __db: Db | undefined;
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

function getDb(): Db {
  if (!global.__db) {
    if (!global.__pgClient) {
      global.__pgClient = postgres(serverEnv().DATABASE_URL, { prepare: false });
    }
    global.__db = drizzle(global.__pgClient, { schema });
  }
  return global.__db;
}

// Proxy so importing `db` doesn't connect at module load — connection is
// deferred until the first property access (e.g. db.select(...)). Page data
// collection during `next build` evaluates imports but doesn't run queries, so
// the build no longer requires DATABASE_URL to be set.
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export { schema };
