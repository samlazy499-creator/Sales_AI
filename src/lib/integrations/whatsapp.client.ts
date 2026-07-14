import crypto from "crypto";

const GRAPH_API_VERSION = "v21.0";

/**
 * Thin wrapper over the WhatsApp Business Cloud API. Nothing outside
 * this file should construct Graph API requests directly — keeps the
 * token, base URL, and payload shape in one place if Meta changes the
 * API version or we add media message support later.
 */

export async function sendWhatsAppMessage(to: string, text: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error("WhatsApp is not configured — missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN");
  }

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`WhatsApp send failed (${res.status}): ${errBody}`);
  }

  return res.json();
}

/** Meta's webhook verification handshake (GET request with a challenge). */
export function verifyWebhookChallenge(mode: string | null, token: string | null, challenge: string | null) {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === "subscribe" && token === verifyToken && challenge) {
    return challenge;
  }
  return null;
}

/**
 * Validates the X-Hub-Signature-256 header Meta sends on every webhook
 * POST, using a timing-safe comparison. Rejecting unsigned/forged
 * payloads here is what stops anyone who finds the webhook URL from
 * injecting fake customer messages into a business's pipeline.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret || !signatureHeader) return false;

  const expected =
    "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  const sigBuffer = Buffer.from(signatureHeader);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

export interface InboundWhatsAppMessage {
  from: string;
  text: string;
  profileName?: string;
  messageId: string;
}

/** Parses Meta's webhook payload shape down to just what we act on. */
export function parseInboundPayload(payload: unknown): InboundWhatsAppMessage[] {
  const results: InboundWhatsAppMessage[] = [];

  try {
    const entries = (payload as any)?.entry ?? [];
    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        const contacts = value?.contacts ?? [];
        for (const message of value?.messages ?? []) {
          if (message.type !== "text") continue;
          const contact = contacts.find((c: any) => c.wa_id === message.from);
          results.push({
            from: message.from,
            text: message.text?.body ?? "",
            profileName: contact?.profile?.name,
            messageId: message.id,
          });
        }
      }
    }
  } catch {
    // Malformed payload — return whatever we parsed successfully rather
    // than throwing and losing every message in the batch.
  }

  return results;
}
