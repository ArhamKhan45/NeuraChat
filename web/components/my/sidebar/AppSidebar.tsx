"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PenSquare } from "lucide-react";
import toast from "react-hot-toast";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import AppSidebarFooter from "./AppSidebarFooter";
import RecentConversations from "./RecentConversations";

import { useConversations } from "@/hooks/useConversations";

const collapsedButtonClass =
  "group-data-[collapsible=icon]:mx-auto " +
  "group-data-[collapsible=icon]:size-10! " +
  "group-data-[collapsible=icon]:justify-center " +
  "group-data-[collapsible=icon]:gap-0 " +
  "group-data-[collapsible=icon]:p-0!";

interface AppSidebarProps {
  id?: string;
}

export default function AppSidebar({ id }: AppSidebarProps) {
  const router = useRouter();

  const { state, isMobile } = useSidebar();

  const {
    conversations,
    isLoading,
    isCreating,
    deletingId,
    error,
    createNewConversation,
    removeConversation,
  } = useConversations(10);

  const isCollapsed = !isMobile && state === "collapsed";

  const activeId = id ?? null;

  React.useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSelectChat = (conversationId: string): void => {
    router.push(`/chat/${conversationId}`);
  };

  const handleNewChat = async (): Promise<void> => {
    // const conversation = await createNewConversation("New chat");

    // if (!conversation) {
    //   return;
    // }

    router.push(`/`);
  };

  const handleDeleteChat = async (conversationId: string): Promise<void> => {
    const deleted = await removeConversation(conversationId);

    if (!deleted) {
      return;
    }

    toast.success("Conversation deleted");

    if (activeId === conversationId) {
      router.push("/");
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-2">
        <div className="flex w-full items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Go to NeuroChat home"
            className="flex h-12 min-w-0 flex-1 items-center overflow-hidden group-data-[collapsible=icon]:hidden"
          >
            <Image
              src="/images/light.png"
              alt="NeuroChat logo"
              width={140}
              height={40}
              priority
              className="h-full w-auto object-contain object-left dark:hidden"
            />

            <Image
              src="/images/dark.png"
              alt="NeuroChat logo"
              width={140}
              height={40}
              priority
              className="hidden h-full w-auto object-contain object-left dark:block"
            />
          </button>

          <SidebarTrigger className="size-10 shrink-0 rounded-lg group-data-[collapsible=icon]:mx-auto" />
        </div>

        <SidebarMenu>
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton
              size="lg"
              tooltip="New chat"
              onClick={() => {
                void handleNewChat();
              }}
              disabled={isCreating}
              className={collapsedButtonClass}
            >
              <PenSquare className="size-5! shrink-0" />

              <span className="cursor-pointer text-sm font-medium group-data-[collapsible=icon]:hidden">
                {isCreating ? "Creating..." : "New chat"}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <RecentConversations
          conversations={conversations}
          activeId={activeId}
          isCollapsed={isCollapsed}
          isLoading={isLoading}
          deletingId={deletingId}
          onSelect={handleSelectChat}
          onDelete={(conversationId) => {
            void handleDeleteChat(conversationId);
          }}
        />
      </SidebarContent>

      <AppSidebarFooter />
    </Sidebar>
  );
}
