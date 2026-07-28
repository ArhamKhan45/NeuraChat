import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { initialsOfName } from "@/lib/helper";
import { useClerk } from "@clerk/nextjs";
import { ChevronsUpDown, KeyRound, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";

const collapsedButtonClass =
  "group-data-[collapsible=icon]:mx-auto " +
  "group-data-[collapsible=icon]:size-10! " +
  "group-data-[collapsible=icon]:justify-center " +
  "group-data-[collapsible=icon]:gap-0 " +
  "group-data-[collapsible=icon]:p-0!";

const USER = {
  name: "Alex Kumar",
  email: "alex@example.com",
};

const AppSidebarFooter = () => {
  const { signOut } = useClerk();
  const router = useRouter();

  const { user, isLoaded } = useUser();

  return (
    <SidebarFooter className="p-2 group-data-[collapsible=icon]:items-center">
      <SidebarMenu>
        <SidebarMenuItem>
          {!isLoaded ? (
            <SidebarMenuButton
              size="lg"
              className={`pointer-events-none ${collapsedButtonClass}`}
            >
              <Skeleton className="size-8 shrink-0 rounded-full" />

              <div className="flex min-w-0 flex-1 flex-col gap-1.5 group-data-[collapsible=icon]:hidden">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>

              <Skeleton className="ml-auto size-4 rounded group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    tooltip={user?.fullName ?? "User"}
                    className={`gap-2 ${collapsedButtonClass}`}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold">
                      {initialsOfName(user?.fullName ?? "Default User")}
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col text-left group-data-[collapsible=icon]:hidden">
                      <span className="truncate text-sm font-medium">
                        {user?.fullName}
                      </span>

                      <span className="truncate text-sm text-muted-foreground">
                        {user?.primaryEmailAddress?.emailAddress}
                      </span>
                    </span>

                    <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                }
              />

              <DropdownMenuContent
                side="top"
                align="end"
                sideOffset={8}
                className="w-48"
              >
                <DropdownMenuItem
                  className="cursor-pointer text-sm"
                  onClick={() => router.push("/settings")}
                >
                  <Settings className="size-4" />
                  Settings
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="cursor-pointer text-sm"
                  onClick={() => router.push("/profile/model-api-keys")}
                >
                  <KeyRound className="size-4" />
                  Models & API Keys
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer text-sm"
                  onClick={() => signOut({ redirectUrl: "/signin" })}
                >
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};

export default AppSidebarFooter;
