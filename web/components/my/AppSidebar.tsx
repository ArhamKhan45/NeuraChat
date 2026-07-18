"use client";

import * as React from "react";
import {
  ChevronsUpDown,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  PenSquare,
  Search,
  Settings,
  Trash2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Replace with real data from your chat store / API.
const HISTORY: Record<string, { id: string; title: string }[]> = {
  Today: [
    { id: "1", title: "Fix sidebar mobile width" },
    { id: "2", title: "Base UI dropdown trigger error" },
  ],
  Yesterday: [
    { id: "3", title: "Next.js theme provider hydration" },
    { id: "4", title: "Plan Q3 roadmap doc" },
  ],
  "Previous 7 days": [
    { id: "5", title: "Draft onboarding email" },
    { id: "6", title: "Recipe: weeknight tacos" },
    { id: "7", title: "Compare pricing tiers" },
  ],
};

const USER = {
  name: "Alex Kumar",
  email: "alex@example.com",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AppSidebar() {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!query.trim()) return HISTORY;
    const q = query.toLowerCase();
    const result: typeof HISTORY = {};
    for (const [group, items] of Object.entries(HISTORY)) {
      const matches = items.filter((item) =>
        item.title.toLowerCase().includes(q),
      );
      if (matches.length) result[group] = matches;
    }
    return result;
  }, [query]);

  return (
    <Sidebar>
      <SidebarHeader className="gap-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => {
            // Hook up to your "start new chat" handler.
          }}
        >
          <PenSquare className="size-4" />
          New chat
        </Button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <SidebarInput
            placeholder="Search chats"
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {Object.keys(filtered).length === 0 && (
          <p className="px-4 py-2 text-sm text-muted-foreground">
            No chats found.
          </p>
        )}

        {Object.entries(filtered).map(([group, items]) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton>
                      <MessageSquare className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <SidebarMenuAction showOnHover>
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Chat options</span>
                          </SidebarMenuAction>
                        }
                      />
                      <DropdownMenuContent side="right" align="start">
                        <DropdownMenuItem variant="destructive">
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium">
                  {initials(USER.name)}
                </span>
                <span className="flex min-w-0 flex-col text-left">
                  <span className="truncate text-sm font-medium">
                    {USER.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {USER.email}
                  </span>
                </span>
                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem>
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
