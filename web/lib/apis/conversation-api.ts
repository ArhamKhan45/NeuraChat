export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface CreateConversationPayload {
  title?: string;
}

interface ApiErrorResponse {
  detail?: unknown;
}

function getBackendUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  if (!backendUrl) {
    throw new Error("NEXT_PUBLIC_BACKEND_API_URL is not configured");
  }

  return backendUrl;
}

async function getResponseData<T>(response: Response): Promise<T> {
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const errorData = data as ApiErrorResponse | null;

    const message =
      typeof errorData?.detail === "string"
        ? errorData.detail
        : errorData?.detail
          ? JSON.stringify(errorData.detail)
          : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

export async function getRecentConversations(
  token: string,
  limit = 10,
): Promise<Conversation[]> {
  const response = await fetch(
    `${getBackendUrl()}/conversations?limit=${limit}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  return getResponseData<Conversation[]>(response);
}

export async function createConversation(
  token: string,
  payload: CreateConversationPayload = {},
): Promise<Conversation> {
  const response = await fetch(`${getBackendUrl()}/conversations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: payload.title?.trim() || "New chat",
    }),
  });

  return getResponseData<Conversation>(response);
}

export async function deleteConversation(
  token: string,
  conversationId: string,
): Promise<void> {
  const response = await fetch(
    `${getBackendUrl()}/conversations/${conversationId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);

    const errorData = data as ApiErrorResponse | null;

    throw new Error(
      typeof errorData?.detail === "string"
        ? errorData.detail
        : `Could not delete conversation. Status: ${response.status}`,
    );
  }
}
