import { store } from "@/lib/store";
import { sendSms } from "@/lib/sms";
import { logActivity } from "@/lib/data";
import { clientIp, hmac, json, maskPhone, otpCode, rateLimit, sameOrigin } from "@/lib/security";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

const OTP_TTL = 5 * 60;

export async function POST(req: Request) {
  if (!(await sameOrigin(req))) return json({ error: "Bad origin" }, 403);
  const phone = process.env.ADMIN_PHONE;
  if (!phone) return json({ error: "Admin phone is not configured." }, 500);

  const ip = await clientIp();
  // Single admin: limit globally and per IP so the SMS budget cannot be drained.
  if (!(await rateLimit("otp:send:cooldown", 1, 45))) {
    return json({ error: "A code was just sent. Wait a moment before requesting another." }, 429);
  }
  if (!(await rateLimit("otp:send:hour", 6, 3600)) || !(await rateLimit(`otp:send:ip:${ip}`, 10, 3600))) {
    return json({ error: "Too many codes requested. Try again later." }, 429);
  }

  const code = otpCode();
  await store().set("otp:current", { hash: hmac(code), attempts: 0 }, OTP_TTL);

  try {
    await sendSms(phone, `${code} is your ${site.name} admin code. It expires in 5 minutes. Never share it.`);
  } catch (e) {
    console.error("OTP send failed", e);
    await store().del("otp:current");
    return json({ error: "Could not send the SMS. Check the SMS provider settings." }, 502);
  }

  await logActivity("auth.otp_sent", "Admin login code sent", { ip });
  return json({ ok: true, to: maskPhone(phone), expiresIn: OTP_TTL });
}

export async function GET() {
  const phone = process.env.ADMIN_PHONE;
  return json({ to: phone ? maskPhone(phone) : null });
}
