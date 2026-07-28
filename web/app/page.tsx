import LandingScreen from "@/components/my/LandingScreen";
import SyncUser from "@/components/my/SyncUser";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) redirect("/signin");

  return (
    <>
      <SyncUser />
      <LandingScreen />;
    </>
  );
}
