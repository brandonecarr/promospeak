import "server-only";
import { serverEnv } from "@/config/env";

const CHECKR_BASE_URL = "https://api.checkr.com/v1";

export class CheckrError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "CheckrError";
  }
}

async function checkrFetch(path: string, init: RequestInit = {}) {
  const apiKey = serverEnv().CHECKR_API_KEY;
  if (!apiKey) {
    throw new CheckrError(500, "CHECKR_API_KEY is not configured");
  }
  const res = await fetch(`${CHECKR_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new CheckrError(res.status, `Checkr ${res.status}: ${body}`);
  }
  return res.json();
}

export const checkr = {
  invitations: {
    create: (params: { candidate_id: string; package: string }) =>
      checkrFetch("/invitations", {
        method: "POST",
        body: JSON.stringify(params),
      }),
  },
  candidates: {
    create: (params: { email: string; first_name: string; last_name: string }) =>
      checkrFetch("/candidates", {
        method: "POST",
        body: JSON.stringify(params),
      }),
  },
};
