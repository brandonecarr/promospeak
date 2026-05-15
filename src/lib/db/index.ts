import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { serverEnv } from "@/config/env";
import * as schema from "./schema";

declare global {
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

function client() {
  if (!global.__pgClient) {
    global.__pgClient = postgres(serverEnv().DATABASE_URL, { prepare: false });
  }
  return global.__pgClient;
}

export const db = drizzle(client(), { schema });
export { schema };
