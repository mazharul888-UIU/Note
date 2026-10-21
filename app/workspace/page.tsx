import Workspace from "./workspace";
import { isOwner } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  if (!await isOwner()) redirect("/owner/login");
  return <Workspace displayName="Sami" />;
}
