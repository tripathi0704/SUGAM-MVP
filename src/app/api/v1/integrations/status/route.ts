import { ok, requireSession, isNextResponse } from "@/lib/apih";
import { ensureSeed } from "@/lib/seed";

// GET /api/v1/integrations/status — mock connector health (§4.7, honest labeling)
export async function GET() {
  await ensureSeed();
  const user = await requireSession();
  if (isNextResponse(user)) return user as never;
  return ok({
    integrations: [
      {
        key: "DEMO_CPGRAMS", name: "CPGRAMS-style Import (SIMULATED)", status: "SIMULATED",
        detail: "CSV/mock adapter running on synthetic records only. No live government system is connected.",
        productionRequirements: "Official permission, documented API/schema, credentials, data-sharing approval, security review.",
      },
      {
        key: "AI_SUGGESTIONS", name: "Rule-based Category & Urgency Suggestions", status: "ACTIVE_LOCAL",
        detail: "Deterministic keyword rules with visible reasons. Officer can accept or override every suggestion.",
        productionRequirements: "Optional AI classification later; must remain suggestion-only with human review.",
      },
      {
        key: "WHATSAPP_EMAIL", name: "WhatsApp / Email Alerts", status: "NOT_CONFIGURED",
        detail: "In-app notifications are live. Outbound channels need API keys (.env) — intentionally left for the team to configure.",
        productionRequirements: "WhatsApp Business Cloud API + SMTP credentials, template approvals.",
      },
    ],
  });
}
