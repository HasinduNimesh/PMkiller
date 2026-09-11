import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MarketingLanding } from "@/components/marketing-landing";

export default async function HomePage() {
  const session = await auth();
  if (session) redirect("/dashboard");
  return <MarketingLanding />;
}
