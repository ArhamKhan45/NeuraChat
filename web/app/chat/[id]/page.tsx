import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AppSidebar from "@/components/my/sidebar/AppSidebar";
import { ModeToggle } from "@/components/theme-toggle";
import { Menu } from "lucide-react";
import LandingPage from "@/components/my/LandingScreen";

interface ChatPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  return <LandingPage id={id} />;
}
