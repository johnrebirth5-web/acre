import { redirect } from "next/navigation";
import { getDefaultAppPath } from "@acre/auth";
import { getCurrentSessionContext } from "../lib/auth-session";

export default async function HomePage() {
  const context = await getCurrentSessionContext();

  redirect(context ? getDefaultAppPath(context.currentMembership.role) : "/login");
}
