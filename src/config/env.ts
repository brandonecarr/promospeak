import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().url(),
  DIRECT_DATABASE_URL: z.string().url().optional(),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1).optional(),

  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PRICE_STARTER_MONTHLY: z.string().min(1).optional(),
  STRIPE_PRICE_STARTER_ANNUAL: z.string().min(1).optional(),
  STRIPE_PRICE_GROWTH_MONTHLY: z.string().min(1).optional(),
  STRIPE_PRICE_GROWTH_ANNUAL: z.string().min(1).optional(),
  STRIPE_PRICE_ENTERPRISE_MONTHLY: z.string().min(1).optional(),
  STRIPE_PRICE_ENTERPRISE_ANNUAL: z.string().min(1).optional(),

  CHECKR_API_KEY: z.string().min(1).optional(),
  CHECKR_WEBHOOK_SECRET: z.string().min(1).optional(),

  RESEND_API_KEY: z.string().min(1),
  RESEND_WEBHOOK_SECRET: z.string().min(1).optional(),

  OPENAI_API_KEY: z.string().min(1).optional(),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;
type ClientEnv = z.infer<typeof clientEnvSchema>;

function parseServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("Server env accessed from the browser");
  }
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid server environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid server environment variables");
  }
  return parsed.data;
}

function parseClientEnv(): ClientEnv {
  const candidate = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  };
  const parsed = clientEnvSchema.safeParse(candidate);
  if (!parsed.success) {
    console.error("Invalid client environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid client environment variables");
  }
  return parsed.data;
}

let _serverEnv: ServerEnv | null = null;
let _clientEnv: ClientEnv | null = null;

export function serverEnv(): ServerEnv {
  if (!_serverEnv) _serverEnv = parseServerEnv();
  return _serverEnv;
}

export function clientEnv(): ClientEnv {
  if (!_clientEnv) _clientEnv = parseClientEnv();
  return _clientEnv;
}
