import LandingScreen from "@/components/my/LandingScreen";
import SyncUser from "@/components/my/SyncUser";

export default async function HomePage() {
  return (
    <>
      <SyncUser />
      <LandingScreen />
    </>
  );
}
