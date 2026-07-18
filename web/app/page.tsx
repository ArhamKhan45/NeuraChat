import AppSidebar from "@/components/my/AppSidebar";
import { ModeToggle } from "@/components/theme-toggle";

import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { createMetadata } from "@/config/metadata";

export const metadata = createMetadata({
  title: "Dashboard",
});

const HomePage = () => {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <main>
          <SidebarTrigger />
          <ModeToggle />
        </main>
      </SidebarProvider>
    </>
  );
};

export default HomePage;
