import { issueChallenge, POW_BITS } from "@/lib/pow";
import { powSecret } from "@/lib/botguard";
import { json } from "@/lib/security";

export const dynamic = "force-dynamic";

/** A fresh proof-of-work challenge for the public forms. */
export async function GET() {
  return json({ challenge: issueChallenge(powSecret()), bits: POW_BITS });
}
