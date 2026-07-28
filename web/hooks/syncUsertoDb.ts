"use client";

import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

export function useSyncUser(): void {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isUserLoaded || !isAuthLoaded || !isSignedIn || !user) {
      console.log("hello");
      return;
    }

    async function syncUser(): Promise<void> {
      try {
        const email = user?.primaryEmailAddress?.emailAddress;

        if (!email) {
          console.error("User does not have a primary email");
          return;
        }

        const token = await getToken();

        if (!token) {
          console.error("Clerk token was not found");
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/auth/sync-user-to-db`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: user?.fullName ?? user.username ?? "User",
              email,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          console.error("FastAPI response:", data);

          throw new Error(
            data?.detail
              ? JSON.stringify(data.detail)
              : `User sync failed: ${response.status}`,
          );
        }

        console.log("User synchronized:", data);
      } catch (error) {
        console.error("Failed to synchronize user:", error);
      }
    }

    void syncUser();
  }, [getToken, isAuthLoaded, isSignedIn, isUserLoaded, user]);
}
