import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AppSidebar from "@/components/my/AppSidebar";
import { ModeToggle } from "@/components/theme-toggle";
import { Menu } from "lucide-react";

interface ChatPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
          "--sidebar-width-icon": "4.5rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />

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
          <div>Chat ID: {id}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
