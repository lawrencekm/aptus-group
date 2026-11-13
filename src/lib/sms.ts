import "server-only";

/**
 * Sends a single SMS. Provider is chosen with SMS_PROVIDER:
 *  - "sozuri"          Sozuri messaging API (Kenya)
 *  - "africastalking"  Africa's Talking bulk SMS API
 *  - "console"         prints the message to the server log (development only)
 */
export async function sendSms(to: string, message: string): Promise<void> {
  const provider = (process.env.SMS_PROVIDER || "console").toLowerCase();
  const from = process.env.SMS_SENDER_ID || undefined;

  if (provider === "console") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMS_PROVIDER=console is not allowed in production. Configure sozuri or africastalking.");
    }
    console.log(`\n[sms:console] to ${to}: ${message}\n`);
    return;
  }

  if (provider === "africastalking") {
    const username = process.env.AT_USERNAME;
    const apiKey = process.env.AT_API_KEY;
    if (!username || !apiKey) throw new Error("AT_USERNAME and AT_API_KEY are required.");
    const host = username === "sandbox" ? "api.sandbox.africastalking.com" : "api.africastalking.com";
    const body = new URLSearchParams({ username, to, message });
    if (from) body.set("from", from);
    const res = await fetch(`https://${host}/version1/messaging`, {
      method: "POST",
      headers: { apiKey, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Africa's Talking error ${res.status}`);
    const data = (await res.json()) as { SMSMessageData?: { Recipients?: { status?: string }[] } };
    const status = data.SMSMessageData?.Recipients?.[0]?.status;
    if (status && status !== "Success") throw new Error(`Africa's Talking rejected the message: ${status}`);
    return;
  }

  if (provider === "sozuri") {
    const apiKey = process.env.SOZURI_API_KEY;
    const project = process.env.SOZURI_PROJECT;
    const url = process.env.SOZURI_API_URL || "https://sozuri.net/api/v1/messaging";
    if (!apiKey || !project) throw new Error("SOZURI_API_KEY and SOZURI_PROJECT are required.");
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project,
        from,
        to: to.replace(/^\+/, ""),
        campaign: "admin-otp",
        channel: "sms",
        apiKey,
        message,
        type: "transactional",
      }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Sozuri error ${res.status}`);
    return;
  }

  throw new Error(`Unknown SMS_PROVIDER "${provider}"`);
}
