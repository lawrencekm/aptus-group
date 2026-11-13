import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/security";
import { site } from "@/lib/site";
import { Dashboard } from "./Dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Middleware checked the signature; this also checks the session was not revoked.
  if (!(await currentAdmin())) redirect("/admin/login");
  return <Dashboard siteUrl={site.url} />;
}
