"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { transitionApplication } from "@/server/actions/applications";
import { startConversation } from "@/server/actions/messages";
import { requestBackgroundCheck } from "@/server/actions/verifications";

type Ambassador = {
  id: string;
  displayName: string;
  slug: string;
  headline: string | null;
  city: string | null;
  state: string | null;
  languages: string[];
  skills: string[];
  verifiedIdAt: Date | null;
  backgroundCheckStatus: "pending" | "approved" | "rejected" | null;
};

type Application = {
  id: string;
  status: string;
  coverNote: string | null;
  offeredPayCents: number | null;
  agencyNote: string | null;
};

export function ApplicantRow({
  application,
  ambassador,
}: {
  application: Application;
  ambassador: Ambassador;
}) {
  const [offering, setOffering] = useState(false);

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight">{ambassador.displayName}</h3>
            {ambassador.verifiedIdAt ? <Badge variant="default">ID verified</Badge> : null}
            {ambassador.backgroundCheckStatus === "approved" ? (
              <Badge variant="default">Background ✓</Badge>
            ) : null}
          </div>
          {ambassador.headline ? (
            <p className="text-sm text-muted-foreground">{ambassador.headline}</p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            {[ambassador.city, ambassador.state].filter(Boolean).join(", ") || "Location not set"}
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          {application.status.replace("_", " ")}
        </Badge>
      </div>

      {(ambassador.skills.length > 0 || ambassador.languages.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          {ambassador.languages.map((l) => (
            <Badge key={`l-${l}`} variant="secondary">
              {l}
            </Badge>
          ))}
          {ambassador.skills.map((s) => (
            <Badge key={`s-${s}`} variant="outline">
              {s}
            </Badge>
          ))}
        </div>
      )}

      {application.coverNote ? (
        <div className="mt-3 rounded-md border bg-muted/30 p-3 text-sm">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Cover note</p>
          <p className="mt-1 whitespace-pre-wrap">{application.coverNote}</p>
        </div>
      ) : null}

      {application.status === "offered" && application.offeredPayCents !== null ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Offered {formatCents(application.offeredPayCents)} — awaiting ambassador confirmation.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <form action={startConversation}>
          <input type="hidden" name="ambassadorId" value={ambassador.id} />
          <input type="hidden" name="applicationId" value={application.id} />
          <Button type="submit" size="sm" variant="outline">
            Message
          </Button>
        </form>
        {application.status === "applied" ? (
          <ActionForm applicationId={application.id} action="shortlist" label="Shortlist" />
        ) : null}
        {["applied", "shortlisted"].includes(application.status) ? (
          <Button size="sm" variant="outline" onClick={() => setOffering((s) => !s)}>
            {offering ? "Cancel offer" : "Offer"}
          </Button>
        ) : null}
        {["shortlisted", "offered"].includes(application.status) &&
        !ambassador.backgroundCheckStatus ? (
          <form action={requestBackgroundCheck}>
            <input type="hidden" name="applicationId" value={application.id} />
            <Button type="submit" size="sm" variant="outline">
              Run background check
            </Button>
          </form>
        ) : null}
        {["shortlisted", "offered"].includes(application.status) ? (
          <ActionForm
            applicationId={application.id}
            action="reset"
            label="Back to applied"
            variant="ghost"
          />
        ) : null}
        {["applied", "shortlisted", "offered"].includes(application.status) ? (
          <ActionForm
            applicationId={application.id}
            action="decline"
            label="Decline"
            variant="ghost"
          />
        ) : null}
        {application.status === "confirmed" ? (
          <>
            <ActionForm applicationId={application.id} action="complete" label="Mark completed" />
            <ActionForm
              applicationId={application.id}
              action="no_show"
              label="No-show"
              variant="ghost"
            />
          </>
        ) : null}
      </div>

      {offering ? (
        <form action={transitionApplication} className="mt-4 space-y-3 rounded-md border bg-muted/20 p-3">
          <input type="hidden" name="applicationId" value={application.id} />
          <input type="hidden" name="action" value="offer" />
          <div className="space-y-1.5">
            <Label htmlFor={`offeredPayCents-${application.id}`}>Offered pay (¢)</Label>
            <Input
              id={`offeredPayCents-${application.id}`}
              name="offeredPayCents"
              type="number"
              placeholder="Leave blank to use job's posted rate"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`agencyNote-${application.id}`}>Note to ambassador</Label>
            <Textarea
              id={`agencyNote-${application.id}`}
              name="agencyNote"
              rows={3}
              placeholder="Call time, where to meet, what to wear…"
            />
          </div>
          <Button type="submit" size="sm">
            Send offer
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function ActionForm({
  applicationId,
  action,
  label,
  variant,
}: {
  applicationId: string;
  action: string;
  label: string;
  variant?: "default" | "outline" | "ghost";
}) {
  return (
    <form action={transitionApplication}>
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="action" value={action} />
      <Button type="submit" size="sm" variant={variant ?? "outline"}>
        {label}
      </Button>
    </form>
  );
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
