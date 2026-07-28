"use client";

import * as React from "react";
import toast from "react-hot-toast";
import {
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  MessageSquare,
  Save,
  ShieldCheck,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Provider {
  value: string;
  label: string;
  models: string[];
}

interface ModelFormState {
  provider: string;
  model: string;
  apiKey: string;
  showApiKey: boolean;
}

const PROVIDERS: Provider[] = [
  {
    value: "groq",
    label: "Groq",
    models: [
      "llama-3.1-8b-instant",
      "llama-3.3-70b-versatile",
      "openai/gpt-oss-20b",
      "openai/gpt-oss-120b",
      "qwen/qwen3-32b",
    ],
  },
  {
    value: "nvidia",
    label: "NVIDIA NIM",
    models: [
      "meta/llama-3.1-8b-instruct",
      "meta/llama-3.3-70b-instruct",
      "qwen/qwen3-32b",
      "google/gemma-4-31b-it",
    ],
  },
  {
    value: "google",
    label: "Google Gemini",
    models: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"],
  },
  {
    value: "openai",
    label: "OpenAI",
    models: ["gpt-5", "gpt-5-mini", "gpt-4.1", "gpt-4.1-mini"],
  },
  {
    value: "anthropic",
    label: "Anthropic",
    models: ["claude-sonnet-4", "claude-opus-4", "claude-3-5-haiku"],
  },
];

const EMPTY_MODEL: ModelFormState = {
  provider: "",
  model: "",
  apiKey: "",
  showApiKey: false,
};

export default function ModelAPIKeys() {
  const [chatConfig, setChatConfig] =
    React.useState<ModelFormState>(EMPTY_MODEL);

  const [agentConfig, setAgentConfig] =
    React.useState<ModelFormState>(EMPTY_MODEL);

  const [isSaving, setIsSaving] = React.useState(false);

  const chatProvider = PROVIDERS.find(
    (provider) => provider.value === chatConfig.provider,
  );

  const agentProvider = PROVIDERS.find(
    (provider) => provider.value === agentConfig.provider,
  );

  const updateChatProvider = (value: string | null): void => {
    if (value === null) {
      return;
    }

    setChatConfig((current) => ({
      ...current,
      provider: value,
      model: "",
    }));
  };

  const updateAgentProvider = (value: string | null): void => {
    if (value === null) {
      return;
    }

    setAgentConfig((current) => ({
      ...current,
      provider: value,
      model: "",
    }));
  };

  const handleSave = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    if (
      !chatConfig.provider ||
      !chatConfig.model ||
      !chatConfig.apiKey.trim()
    ) {
      toast.error("Chat provider, model, and API key are required.");
      return;
    }

    const agentHasAnyValue = Boolean(
      agentConfig.provider || agentConfig.model || agentConfig.apiKey.trim(),
    );

    const agentIsComplete = Boolean(
      agentConfig.provider && agentConfig.model && agentConfig.apiKey.trim(),
    );

    if (agentHasAnyValue && !agentIsComplete) {
      toast.error("Complete all agent fields or leave all of them empty.");
      return;
    }

    setIsSaving(true);
    console.log("hello");
    const loadingToast = toast.loading("Saving model configurations...");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/model-configurations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat: {
              provider: chatConfig.provider,
              model: chatConfig.model,
              api_key: chatConfig.apiKey.trim(),
            },
            agent: agentIsComplete
              ? {
                  provider: agentConfig.provider,
                  model: agentConfig.model,
                  api_key: agentConfig.apiKey.trim(),
                }
              : null,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail ?? "Could not save model configurations.");
      }

      toast.success("Model configurations saved successfully.", {
        id: loadingToast,
      });
    } catch (error) {
      console.log("hello");
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

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header>
          <div className="flex items-center gap-2">
            <KeyRound className="size-6 shrink-0" />

            <h1 className="text-2xl font-semibold tracking-tight">
              Models & API Keys
            </h1>
          </div>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Configure the main chat model and optionally add a separate model
            for the multi-agent system.
          </p>
        </header>

        <Alert>
          <ShieldCheck className="size-4" />

          <AlertTitle>Agent model fallback</AlertTitle>

          <AlertDescription>
            When no agent model is configured, NeuraChat will use the chat model
            for routing, tools, planning, and other agent operations.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSave}>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <MessageSquare className="size-5 text-primary" />
                  </div>

                  <div>
                    <CardTitle>Chat model</CardTitle>

                    <CardDescription className="mt-1">
                      Required for normal conversations and streaming responses.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="chat-provider">Provider</Label>

                  <Select
                    value={chatConfig.provider}
                    onValueChange={updateChatProvider}
                  >
                    <SelectTrigger id="chat-provider" className="w-full">
                      <SelectValue placeholder="Select chat provider" />
                    </SelectTrigger>

                    <SelectContent>
                      {PROVIDERS.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chat-model">Model</Label>

                  <Select
                    value={chatConfig.model}
                    onValueChange={(value) => {
                      if (value === null) {
                        return;
                      }

                      setChatConfig((current) => ({
                        ...current,
                        model: value,
                      }));
                    }}
                    disabled={!chatConfig.provider}
                  >
                    <SelectTrigger id="chat-model" className="w-full">
                      <SelectValue
                        placeholder={
                          chatConfig.provider
                            ? "Select chat model"
                            : "Select provider first"
                        }
                      />
                    </SelectTrigger>

                    <SelectContent>
                      {chatProvider?.models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chat-api-key">Chat API key</Label>

                  <div className="relative">
                    <Input
                      id="chat-api-key"
                      type={chatConfig.showApiKey ? "text" : "password"}
                      value={chatConfig.apiKey}
                      onChange={(event) =>
                        setChatConfig((current) => ({
                          ...current,
                          apiKey: event.target.value,
                        }))
                      }
                      placeholder="Enter chat model API key"
                      className="h-10 pr-11"
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setChatConfig((current) => ({
                          ...current,
                          showApiKey: !current.showApiKey,
                        }))
                      }
                      className="absolute right-0 top-0 flex size-10 items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label={
                        chatConfig.showApiKey ? "Hide API key" : "Show API key"
                      }
                    >
                      <span className="relative block size-4">
                        <Eye
                          className={`absolute inset-0 size-4 transition-opacity ${
                            chatConfig.showApiKey ? "opacity-0" : "opacity-100"
                          }`}
                        />

                        <EyeOff
                          className={`absolute inset-0 size-4 transition-opacity ${
                            chatConfig.showApiKey ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />

                  <span>This configuration is required.</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Bot className="size-5 text-primary" />
                  </div>

                  <div>
                    <CardTitle>Agent model</CardTitle>

                    <CardDescription className="mt-1">
                      Optional model for routing, planning, tools, and
                      specialized agents.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="agent-provider">
                    Provider
                    <span className="ml-1 text-muted-foreground">
                      (optional)
                    </span>
                  </Label>

                  <Select
                    value={agentConfig.provider}
                    onValueChange={updateAgentProvider}
                  >
                    <SelectTrigger id="agent-provider" className="w-full">
                      <SelectValue placeholder="Select agent provider" />
                    </SelectTrigger>

                    <SelectContent>
                      {PROVIDERS.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-model">
                    Model
                    <span className="ml-1 text-muted-foreground">
                      (optional)
                    </span>
                  </Label>

                  <Select
                    value={agentConfig.model}
                    onValueChange={(value) => {
                      if (value === null) {
                        return;
                      }

                      setAgentConfig((current) => ({
                        ...current,
                        model: value,
                      }));
                    }}
                    disabled={!agentConfig.provider}
                  >
                    <SelectTrigger id="agent-model" className="w-full">
                      <SelectValue
                        placeholder={
                          agentConfig.provider
                            ? "Select agent model"
                            : "Select provider first"
                        }
                      />
                    </SelectTrigger>

                    <SelectContent>
                      {agentProvider?.models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-api-key">
                    Agent API key
                    <span className="ml-1 text-muted-foreground">
                      (optional)
                    </span>
                  </Label>

                  <div className="relative">
                    <Input
                      id="agent-api-key"
                      type={agentConfig.showApiKey ? "text" : "password"}
                      value={agentConfig.apiKey}
                      onChange={(event) =>
                        setAgentConfig((current) => ({
                          ...current,
                          apiKey: event.target.value,
                        }))
                      }
                      placeholder="Enter agent model API key"
                      className="h-10 pr-11"
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setAgentConfig((current) => ({
                          ...current,
                          showApiKey: !current.showApiKey,
                        }))
                      }
                      className="absolute right-0 top-0 flex size-10 items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label={
                        agentConfig.showApiKey ? "Hide API key" : "Show API key"
                      }
                    >
                      <span className="relative block size-4">
                        <Eye
                          className={`absolute inset-0 size-4 transition-opacity ${
                            agentConfig.showApiKey ? "opacity-0" : "opacity-100"
                          }`}
                        />

                        <EyeOff
                          className={`absolute inset-0 size-4 transition-opacity ${
                            agentConfig.showApiKey ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </span>
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
                  Leave this configuration empty to use the chat model for agent
                  operations.
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
              disabled={isSaving}
              aria-busy={isSaving}
              className="w-full min-w-64 sm:w-auto"
            >
              <span className="relative block size-4 shrink-0">
                <Save
                  className={`absolute inset-0 size-4 ${
                    isSaving ? "opacity-0" : "opacity-100"
                  }`}
                />

                <Loader2
                  className={`absolute inset-0 size-4 animate-spin ${
                    isSaving ? "opacity-100" : "opacity-0"
                  }`}
                />
              </span>

              <span className="inline-block min-w-48 text-center">
                {isSaving
                  ? "Saving configurations..."
                  : "Save model configurations"}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
