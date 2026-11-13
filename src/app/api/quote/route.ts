import { handlePublicRequest } from "@/lib/requests";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handlePublicRequest(req, "quote");
}
