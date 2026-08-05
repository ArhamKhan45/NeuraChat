"use client";

import {
  History,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

import type { Conversation } from "@/lib/apis/conversation-api";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
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

interface RecentConversationsProps {
  conversations: Conversation[];
  activeId: string | null;
  isCollapsed: boolean;
  isLoading: boolean;
  deletingId: string | null;
  onSelect: (conversationId: string) => void;
  onDelete: (conversationId: string) => void;
}

const collapsedButtonClass =
  "group-data-[collapsible=icon]:mx-auto " +
  "group-data-[collapsible=icon]:size-10! " +
  "group-data-[collapsible=icon]:justify-center " +
  "group-data-[collapsible=icon]:gap-0 " +
  "group-data-[collapsible=icon]:p-0!";

export default function RecentConversations({
  conversations,
  activeId,
  isCollapsed,
  isLoading,
  deletingId,
  onSelect,
  onDelete,
}: RecentConversationsProps) {
  if (isCollapsed) {
    return (
      <CollapsedRecentConversations
        conversations={conversations.slice(0, 8)}
        activeId={activeId}
        isLoading={isLoading}
        deletingId={deletingId}
        onSelect={onSelect}
        onDelete={onDelete}
      />
    );
  }

  return (
    <SidebarGroup className="px-2">
      <SidebarGroupLabel className="px-2 text-base font-semibold">
        Recent
      </SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu className="space-y-2.5">
          {isLoading ? (
            <RecentLoader />
          ) : conversations.length > 0 ? (
            conversations.map((conversation) => (
              <ConversationMenuItem
                key={conversation.id}
                conversation={conversation}
                isActive={activeId === conversation.id}
                isDeleting={deletingId === conversation.id}
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ))
          ) : (
            <EmptyRecent />
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

interface ConversationMenuItemProps {
  conversation: Conversation;
  isActive: boolean;
  isDeleting: boolean;
  onSelect: (conversationId: string) => void;
  onDelete: (conversationId: string) => void;
}

function ConversationMenuItem({
  conversation,
  isActive,
  isDeleting,
  onSelect,
  onDelete,
}: ConversationMenuItemProps) {
  return (
    <SidebarMenuItem className="relative min-h-10">
      <SidebarMenuButton
        tooltip={conversation.title}
        isActive={isActive}
        onClick={() => onSelect(conversation.id)}
        className="h-10 cursor-pointer gap-3 pr-11"
      >
        <MessageCircle className="size-5! shrink-0" />

        <span className="truncate text-sm font-medium">
          {conversation.title}
        </span>
      </SidebarMenuButton>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuAction
              showOnHover
              aria-label={`Options for ${conversation.title}`}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              className="right-2 top-1/2! size-7 -translate-y-1/2 items-center justify-center data-[state=open]:flex data-[state=open]:opacity-100"
            >
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MoreHorizontal className="size-4" />
              )}
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
            disabled={isDeleting}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(conversation.id);
            }}
            className="cursor-pointer text-sm"
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function CollapsedRecentConversations({
  conversations,
  activeId,
  isLoading,
  deletingId,
  onSelect,
  onDelete,
}: Omit<RecentConversationsProps, "isCollapsed">) {
  return (
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
                    {isLoading ? (
                      <RecentLoader />
                    ) : conversations.length > 0 ? (
                      conversations.map((conversation) => (
                        <CollapsedConversationItem
                          key={conversation.id}
                          conversation={conversation}
                          isActive={activeId === conversation.id}
                          isDeleting={deletingId === conversation.id}
                          onSelect={onSelect}
                          onDelete={onDelete}
                        />
                      ))
                    ) : (
                      <EmptyRecent />
                    )}
                  </div>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function CollapsedConversationItem({
  conversation,
  isActive,
  isDeleting,
  onSelect,
  onDelete,
}: ConversationMenuItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(conversation.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(conversation.id);
        }
      }}
      className={`group/chat relative flex min-h-10 cursor-pointer items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isActive
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 pr-11 text-sm font-medium">
        <MessageCircle className="size-5 shrink-0" />

        <span className="min-w-0 flex-1 truncate">{conversation.title}</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label={`Options for ${conversation.title}`}
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
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/chat:opacity-100 data-[state=open]:opacity-100"
            >
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MoreHorizontal className="size-4" />
              )}
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
            disabled={isDeleting}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(conversation.id);
            }}
            className="cursor-pointer text-sm"
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function RecentLoader() {
  return (
    <div className="flex items-center justify-center px-2 py-6">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function EmptyRecent() {
  return (
    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
      No recent chats
    </div>
  );
}
