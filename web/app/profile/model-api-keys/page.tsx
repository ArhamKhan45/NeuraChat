"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { KeyRound, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";

import FullScreenLoader from "@/components/common/FullScreenLoader";
import Header from "@/components/common/Header";
import ModelConfigurationForm from "@/components/my/ModelConfigurationForm";
import { Button } from "@/components/ui/button";

import {
  type ApiErrorResponse,
  type ConfigurationsResponse,
  type ModelFormState,
  createEmptyModel,
} from "@/lib/model-configuration-data";

export default function ModelAPIKeys() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [chatConfig, setChatConfig] =
    React.useState<ModelFormState>(createEmptyModel);

  const [agentConfig, setAgentConfig] =
    React.useState<ModelFormState>(createEmptyModel);

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  React.useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn || !backendUrl) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadConfigurations = async (): Promise<void> => {
      try {
        const token = await getToken();

        if (!token) {
          throw new Error("Authentication token was not found.");
        }

        const response = await fetch(`${backendUrl}/model-configurations`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
          signal: controller.signal,
        });

        const data = (await response.json().catch(() => null)) as
          | ConfigurationsResponse
          | ApiErrorResponse
          | null;

        if (!response.ok) {
          throw new Error(
            getErrorMessage(data, "Could not load model configurations."),
          );
        }

        const configurations = data as ConfigurationsResponse;

        if (configurations.chat) {
          setChatConfig({
            provider: configurations.chat.provider,
            modelName: configurations.chat.model_name,
            modelUrl: configurations.chat.model_url ?? "",
            apiKey: configurations.chat.api_key,
            showApiKey: false,
          });
        } else {
          setChatConfig(createEmptyModel());
        }

        if (configurations.agent) {
          setAgentConfig({
            provider: configurations.agent.provider,
            modelName: configurations.agent.model_name,
            modelUrl: configurations.agent.model_url ?? "",
            apiKey: configurations.agent.api_key,
            showApiKey: false,
          });
        } else {
          setAgentConfig(createEmptyModel());
        }
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        toast.error(
          error instanceof Error
            ? error.message
            : "Could not load model configurations.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadConfigurations();

    return () => {
      controller.abort();
    };
  }, [backendUrl, getToken, isLoaded, isSignedIn]);

  const handleSave = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    if (!backendUrl) {
      toast.error("Backend API URL is not configured.");
      return;
    }

    if (!isLoaded || !isSignedIn) {
      toast.error("You must be signed in.");
      return;
    }

    const chatProvider = chatConfig.provider.trim();
    const chatModelName = chatConfig.modelName.trim();
    const chatApiKey = chatConfig.apiKey.trim();
    const chatModelUrl = chatConfig.modelUrl.trim();

    if (!chatProvider || !chatModelName || !chatApiKey) {
      toast.error("Chat provider, model, and API key are required.");
      return;
    }

    const agentProvider = agentConfig.provider.trim();
    const agentModelName = agentConfig.modelName.trim();
    const agentApiKey = agentConfig.apiKey.trim();
    const agentModelUrl = agentConfig.modelUrl.trim();

    const agentHasAnyValue = Boolean(
      agentProvider || agentModelName || agentApiKey || agentModelUrl,
    );

    const agentIsComplete = Boolean(
      agentProvider && agentModelName && agentApiKey,
    );

    if (agentHasAnyValue && !agentIsComplete) {
      toast.error(
        "Complete the agent provider, model, and API key, or leave all agent fields empty.",
      );
      return;
    }

    setIsSaving(true);

    const loadingToast = toast.loading("Saving model configurations...");

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Authentication token was not found.");
      }

      const response = await fetch(`${backendUrl}/model-configurations`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat: {
            provider: chatProvider,
            model_name: chatModelName,
            model_url: chatModelUrl || null,
            api_key: chatApiKey,
          },
          agent: agentIsComplete
            ? {
                provider: agentProvider,
                model_name: agentModelName,
                model_url: agentModelUrl || null,
                api_key: agentApiKey,
              }
            : null,
        }),
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            `Could not save configurations. Status: ${response.status}`,
          ),
        );
      }

      toast.success("Model configurations saved successfully.", {
        id: loadingToast,
      });
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save model configurations.",
        {
          id: loadingToast,
        },
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <FullScreenLoader message="Loading model configurations..." />;
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto mt-10 w-full max-w-6xl px-6 py-6 md:mt-16">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <KeyRound className="size-6 shrink-0 text-primary" />

            <div>
              <h1 className="text-2xl font-semibold">Models & API Keys</h1>

              <p className="text-sm text-muted-foreground">
                Configure the models used by NeuraChat.
              </p>
            </div>
          </div>

          <Button
            type="submit"
            form="model-configuration-form"
            disabled={isSaving}
            className="min-w-40"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}

            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>

        <form id="model-configuration-form" onSubmit={handleSave}>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-5">
            <ModelConfigurationForm
              type="chat"
              value={chatConfig}
              onChange={setChatConfig}
            />

            <ModelConfigurationForm
              type="agent"
              value={agentConfig}
              onChange={setAgentConfig}
            />
          </div>
        </form>
      </div>
    </main>
  );
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "detail" in data) {
    const detail = (data as ApiErrorResponse).detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (detail !== undefined) {
      return JSON.stringify(detail);
    }
  }

  return fallback;
}
