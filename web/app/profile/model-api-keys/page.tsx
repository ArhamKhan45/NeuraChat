"use client";

import * as React from "react";
import toast from "react-hot-toast";
import { KeyRound, Loader2, Save, ShieldCheck } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

import FullScreenLoader from "@/components/common/FullScreenLoader";
import ModelConfigurationForm from "@/components/my/ModelConfigurationForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import {
  type ApiErrorResponse,
  type ConfigurationsResponse,
  type ModelFormState,
  createEmptyModel,
} from "@/lib/model-configuration-data";
import Header from "@/components/common/Header";

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
            apiKey: configurations.chat.api_key,
            showApiKey: false,
          });
        }

        if (configurations.agent) {
          setAgentConfig({
            provider: configurations.agent.provider,
            modelName: configurations.agent.model_name,
            apiKey: configurations.agent.api_key,
            showApiKey: false,
          });
        }
      } catch (error: unknown) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not load model configurations.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadConfigurations();
  }, [backendUrl, getToken, isLoaded, isSignedIn]);

  const handleSave = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (isSaving || !backendUrl) {
      return;
    }

    if (
      !chatConfig.provider ||
      !chatConfig.modelName ||
      !chatConfig.apiKey.trim()
    ) {
      toast.error("Chat provider, model, and API key are required.");
      return;
    }

    const agentHasAnyValue = Boolean(
      agentConfig.provider ||
      agentConfig.modelName ||
      agentConfig.apiKey.trim(),
    );

    const agentIsComplete = Boolean(
      agentConfig.provider &&
      agentConfig.modelName &&
      agentConfig.apiKey.trim(),
    );

    if (agentHasAnyValue && !agentIsComplete) {
      toast.error("Complete all agent fields or leave them empty.");
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
            provider: chatConfig.provider,
            model_name: chatConfig.modelName,
            api_key: chatConfig.apiKey.trim(),
          },
          agent: agentIsComplete
            ? {
                provider: agentConfig.provider,
                model_name: agentConfig.modelName,
                api_key: agentConfig.apiKey.trim(),
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
      <div className="mx-auto w-full max-w-6xl mt-10 md:mt-16 px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KeyRound className="size-6 text-primary" />

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
            Save
          </Button>
        </div>

        <form id="model-configuration-form" onSubmit={handleSave}>
          <div className="grid gap-8 lg:gap-5 lg:grid-cols-2">
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
