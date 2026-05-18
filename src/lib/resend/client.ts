import "server-only";
import { Resend } from "resend";
import { serverEnv } from "@/config/env";

let _resend: Resend | null = null;

export function resend() {
  if (!_resend) {
    const key = serverEnv().RESEND_API_KEY;
    if (!key) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    _resend = new Resend(key);
  }
  return _resend;
}
