"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  History,
  MessageCircle,
  MoreHorizontal,
  PenSquare,
  Trash2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AppSidebarFooter from "./sidebar/AppSidebarFooter";

type ChatHistoryItem = {
  id: string;
  title: string;
};

const INITIAL_HISTORY: ChatHistoryItem[] = [
  { id: "1", title: "Fix sidebar mobile width" },
  { id: "2", title: "Base UI dropdown trigger error" },
  { id: "3", title: "Next.js theme provider hydration" },
  { id: "4", title: "Plan Q3 roadmap doc" },
  { id: "5", title: "Draft onboarding email" },
  { id: "6", title: "Recipe: weeknight tacos" },
  { id: "7", title: "Compare pricing tiers" },
  { id: "8", title: "Improve chat streaming UI" },
  { id: "9", title: "Configure AI model settings" },
  { id: "10", title: "Fix authentication callback" },
];

const collapsedButtonClass =
  "group-data-[collapsible=icon]:mx-auto " +
  "group-data-[collapsible=icon]:size-10! " +
  "group-data-[collapsible=icon]:justify-center " +
  "group-data-[collapsible=icon]:gap-0 " +
  "group-data-[collapsible=icon]:p-0!";

export default function AppSidebar({ id }: { id?: string }) {
  const router = useRouter();
  const { state, isMobile } = useSidebar();

  const isCollapsed = !isMobile && state === "collapsed";

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [history, setHistory] =
    React.useState<ChatHistoryItem[]>(INITIAL_HISTORY);

  const dropdownHistory = history.slice(0, 8);

  const handleSelectChat = (id: string) => {
    setActiveId(id);
    router.push(`/chat/${id}`);
  };

  const handleNewChat = () => {
    setActiveId(null);
    router.push("/");
  };

  const handleDeleteChat = (id: string) => {
    setHistory((currentHistory) =>
      currentHistory.filter((chat) => chat.id !== id),
    );

    setActiveId((currentActiveId) =>
      currentActiveId === id ? null : currentActiveId,
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-2">
        {/* Logo and sidebar trigger */}
        <div className="flex w-full items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-12 min-w-0 flex-1 items-center overflow-hidden group-data-[collapsible=icon]:hidden ">
            <Image
              src="/images/light.png"
              alt="NeuroChat logo"
              width={140}
              height={40}
              priority
              onClick={handleNewChat}
              className="h-full w-auto object-contain object-left dark:hidden cursor-pointer"
            />

            <Image
              src="/images/dark.png"
              alt="NeuroChat logo"
              width={140}
              height={40}
              priority
              onClick={handleNewChat}
              className="hidden h-full w-auto object-contain object-left dark:block cursor-pointer"
            />
          </div>

          <SidebarTrigger className="size-10 shrink-0 rounded-lg group-data-[collapsible=icon]:mx-auto" />
        </div>

        {/* New chat */}
        <SidebarMenu>
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton
              size="lg"
              tooltip="New chat"
              onClick={handleNewChat}
              className={collapsedButtonClass}
            >
              <PenSquare className="size-5! shrink-0" />

              <span className="text-sm font-medium group-data-[collapsible=icon]:hidden cursor-pointer">
                New chat
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Expanded sidebar */}
        {!isCollapsed && (
          <SidebarGroup className="px-2">
            <SidebarGroupLabel className="px-2 text-base font-semibold">
              Recent
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu className="space-y-2.5">
                {history.length > 0 ? (
                  history.map((item) => (
                    <SidebarMenuItem
                      key={item.id}
                      className="relative min-h-10"
                    >
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={activeId === item.id}
                        onClick={() => handleSelectChat(item.id)}
                        className="h-10 gap-3 pr-11 cursor-pointer"
                      >
                        <MessageCircle className="size-5! shrink-0" />

                        <span className="truncate text-sm font-medium ">
                          {item.title}
                        </span>
                      </SidebarMenuButton>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <SidebarMenuAction
                              showOnHover
                              aria-label={`Options for ${item.title}`}
                              onPointerDown={(event) => {
                                event.stopPropagation();
                              }}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                              }}
                              className="
                                right-2
                                top-1/2!
                                size-7
                                -translate-y-1/2
                                items-center
                                justify-center
                                data-[state=open]:flex
                                data-[state=open]:opacity-100
                              "
                            >
                              <MoreHorizontal className="size-4" />

                              <span className="sr-only">
                                Options for {item.title}
                              </span>
                            </SidebarMenuAction>
                          }
                        />

                        <DropdownMenuContent
                          side="right"
                          align="center"
                          sideOffset={8}
                          className="w-40"
                        >
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteChat(item.id);
                            }}
                            className="cursor-pointer text-sm"
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                    No recent chats
                  </div>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Collapsed sidebar */}
        {isCollapsed && (
          <SidebarGroup className="px-1">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem className="flex justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <SidebarMenuButton
                          size="lg"
                          tooltip="Recent chats"
                          className={collapsedButtonClass}
                        >
                          <History className="size-5! shrink-0" />
                          <span className="sr-only">Recent chats</span>
                        </SidebarMenuButton>
                      }
                    />

                    <DropdownMenuContent
                      side="right"
                      align="start"
                      sideOffset={10}
                      className="w-80 p-2"
                    >
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="px-2 py-2 text-base font-semibold">
                          Recent chats
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator />

                        <div className="max-h-105 space-y-2.5 overflow-y-auto py-2">
                          {dropdownHistory.length > 0 ? (
                            dropdownHistory.map((item) => (
                              <div
                                key={item.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => handleSelectChat(item.id)}
                                onKeyDown={(event) => {
                                  if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                  ) {
                                    event.preventDefault();
                                    handleSelectChat(item.id);
                                  }
                                }}
                                className={`
                                  group/chat relative flex min-h-10 cursor-pointer
                                  items-center rounded-md outline-none
                                  focus-visible:ring-2 focus-visible:ring-ring
                                  ${
                                    activeId === item.id
                                      ? "bg-accent text-accent-foreground"
                                      : "hover:bg-accent hover:text-accent-foreground"
                                  }
                                `}
                              >
                                <div className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 pr-11 text-sm font-medium">
                                  <MessageCircle className="size-5 shrink-0" />

                                  <span className="min-w-0 flex-1 truncate">
                                    {item.title}
                                  </span>
                                </div>

                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={
                                      <button
                                        type="button"
                                        aria-label={`Options for ${item.title}`}
                                        onPointerDown={(event) => {
                                          event.stopPropagation();
                                        }}
                                        onClick={(event) => {
                                          event.preventDefault();
                                          event.stopPropagation();
                                        }}
                                        onKeyDown={(event) => {
                                          event.stopPropagation();
                                        }}
                                        className="
                                          absolute right-2 top-1/2
                                          flex size-7 -translate-y-1/2
                                          items-center justify-center rounded-md
                                          text-muted-foreground opacity-0
                                          transition-opacity
                                          hover:bg-background
                                          hover:text-foreground
                                          focus-visible:opacity-100
                                          focus-visible:outline-none
                                          focus-visible:ring-2
                                          focus-visible:ring-ring
                                          group-hover/chat:opacity-100
                                          data-[state=open]:opacity-100
                                        "
                                      >
                                        <MoreHorizontal className="size-4" />
                                      </button>
                                    }
                                  />

                                  <DropdownMenuContent
                                    side="right"
                                    align="center"
                                    sideOffset={8}
                                    className="w-40"
                                  >
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleDeleteChat(item.id);
                                      }}
                                      className="cursor-pointer text-sm"
                                    >
                                      <Trash2 className="size-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            ))
                          ) : (
                            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                              No recent chats
                            </div>
                          )}
                        </div>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <AppSidebarFooter />
    </Sidebar>
  );
}
