import { adminRoute } from "@/lib/api";
import { listActivity, listQuotes, listShipments } from "@/lib/data";
import { json } from "@/lib/security";
import { store } from "@/lib/store";
import { requestReceiptPath } from "@/lib/requests";

export const dynamic = "force-dynamic";

export const GET = adminRoute(async () => {
  const [shipments, activity, quotes, lastLogin] = await Promise.all([
    listShipments(),
    listActivity(200),
    listQuotes(100),
    store().get<{ at: string; ip: string }>("auth:lastLogin"),
  ]);
  return json({ shipments, activity, quotes: quotes.map((q) => ({ ...q, receiptUrl: requestReceiptPath(q.id) })), lastLogin });
});
