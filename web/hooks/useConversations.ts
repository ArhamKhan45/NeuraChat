"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";

import {
  type Conversation,
  createConversation,
  deleteConversation,
  getRecentConversations,
} from "@/lib/apis/conversation-api";

interface UseConversationsResult {
  conversations: Conversation[];
  isLoading: boolean;
  isCreating: boolean;
  deletingId: string | null;
  error: string | null;
  createNewConversation: (title?: string) => Promise<Conversation | null>;
  removeConversation: (conversationId: string) => Promise<boolean>;
}

let conversationsCache: Conversation[] | null = null;
let cachedUserId: string | null = null;

export function useConversations(limit = 10): UseConversationsResult {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();

  const initialConversations: Conversation[] =
    conversationsCache !== null && cachedUserId === userId
      ? conversationsCache
      : [];

  const hasValidCache = conversationsCache !== null && cachedUserId === userId;

  const [conversations, setConversations] =
    React.useState<Conversation[]>(initialConversations);

  const [isLoading, setIsLoading] = React.useState<boolean>(!hasValidCache);

  const [isCreating, setIsCreating] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const requestIdRef = React.useRef(0);
  const hasLoadedRef = React.useRef(false);

  const updateConversations = React.useCallback(
    (
      updater:
        | Conversation[]
        | ((currentConversations: Conversation[]) => Conversation[]),
    ): void => {
      setConversations((currentConversations) => {
        const updatedConversations =
          typeof updater === "function"
            ? updater(currentConversations)
            : updater;

        const limitedConversations = updatedConversations.slice(0, limit);

        conversationsCache = limitedConversations;
        cachedUserId = userId ?? null;

        return limitedConversations;
      });
    },
    [limit, userId],
  );

  React.useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn || !userId) {
      requestIdRef.current += 1;
      hasLoadedRef.current = false;

      conversationsCache = null;
      cachedUserId = null;

      setConversations([]);
      setIsLoading(false);
      setError(null);

      return;
    }

    const hasUserCache = conversationsCache !== null && cachedUserId === userId;

    if (hasUserCache) {
      setConversations(conversationsCache ?? []);
      setIsLoading(false);
      hasLoadedRef.current = true;

      return;
    }

    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;
    setIsLoading(true);
    setError(null);

    const currentRequestId = ++requestIdRef.current;

    const loadConversations = async (): Promise<void> => {
      try {
        const token = await getToken();

        if (!token) {
          throw new Error("Authentication token was not found");
        }

        const data = await getRecentConversations(token, limit);

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        const limitedConversations = data.slice(0, limit);

        conversationsCache = limitedConversations;
        cachedUserId = userId;

        setConversations(limitedConversations);
      } catch (caughtError: unknown) {
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not load conversations",
        );
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    void loadConversations();
  }, [getToken, isLoaded, isSignedIn, limit, userId]);

  React.useEffect(() => {
    return () => {
      requestIdRef.current += 1;
    };
  }, []);

  const createNewConversation = React.useCallback(
    async (title = "New chat"): Promise<Conversation | null> => {
      if (!isLoaded || !isSignedIn || !userId || isCreating) {
        return null;
      }

      requestIdRef.current += 1;

      setIsCreating(true);
      setError(null);

      try {
        const token = await getToken();

        if (!token) {
          throw new Error("Authentication token was not found");
        }

        const newConversation = await createConversation(token, {
          title,
        });

        updateConversations((currentConversations) => {
          const conversationsWithoutDuplicate = currentConversations.filter(
            (conversation) => conversation.id !== newConversation.id,
          );

          return [newConversation, ...conversationsWithoutDuplicate];
        });

        return newConversation;
      } catch (caughtError: unknown) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not create conversation",
        );

        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [getToken, isCreating, isLoaded, isSignedIn, updateConversations, userId],
  );

  const removeConversation = React.useCallback(
    async (conversationId: string): Promise<boolean> => {
      if (!isLoaded || !isSignedIn || !userId || deletingId !== null) {
        return false;
      }

      requestIdRef.current += 1;

      setDeletingId(conversationId);
      setError(null);

      try {
        const token = await getToken();

        if (!token) {
          throw new Error("Authentication token was not found");
        }

        await deleteConversation(token, conversationId);

        updateConversations((currentConversations) =>
          currentConversations.filter(
            (conversation) => conversation.id !== conversationId,
          ),
        );

        return true;
      } catch (caughtError: unknown) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not delete conversation",
        );

        return false;
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId, getToken, isLoaded, isSignedIn, updateConversations, userId],
  );

  return {
    conversations,
    isLoading,
    isCreating,
    deletingId,
    error,
    createNewConversation,
    removeConversation,
  };
}
