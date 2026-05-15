import "server-only";
import { Resend } from "resend";
import { serverEnv } from "@/config/env";

let _resend: Resend | null = null;

export function resend() {
  if (!_resend) {
    _resend = new Resend(serverEnv().RESEND_API_KEY);
  }
  return _resend;
}
