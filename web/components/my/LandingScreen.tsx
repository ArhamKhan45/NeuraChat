import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AppSidebar from "@/components/my/AppSidebar";
import { ModeToggle } from "@/components/theme-toggle";
import { Menu } from "lucide-react";
import ChatScreen from "@/components/my/chat/ChatScreen";

export default function LandingPage({ id }: { id?: string }) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
          "--sidebar-width-icon": "4.5rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar id={id} />

      <SidebarInset className="flex h-screen flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between px-4">
          <SidebarTrigger
            size="icon-lg"
            icon={<Menu className="size-5" />}
            className="min-[767px]:hidden"
          />

          <div className="ml-auto">
            <ModeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <ChatScreen chatId={id} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
