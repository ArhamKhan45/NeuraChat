"use client";

import {
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  Link2,
  MessageSquare,
} from "lucide-react";

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

import { type ModelFormState, PROVIDERS } from "@/lib/model-configuration-data";

interface ModelConfigurationFormProps {
  type: "chat" | "agent";
  value: ModelFormState;
  onChange: (value: ModelFormState) => void;
}

export default function ModelConfigurationForm({
  type,
  value,
  onChange,
}: ModelConfigurationFormProps) {
  const isChat = type === "chat";

  const selectedProvider = PROVIDERS.find(
    (provider) => provider.value === value.provider,
  );

  const updateValue = (changes: Partial<ModelFormState>): void => {
    onChange({
      ...value,
      ...changes,
    });
  };

  const handleProviderChange = (provider: string | null): void => {
    if (provider === null) {
      return;
    }

    updateValue({
      provider,
      modelName: "",
    });
  };

  const handleModelChange = (modelName: string | null): void => {
    if (modelName === null) {
      return;
    }

    updateValue({
      modelName,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            {isChat ? (
              <MessageSquare className="size-5 text-primary" />
            ) : (
              <Bot className="size-5 text-primary" />
            )}
          </div>

          <div>
            <CardTitle>{isChat ? "Chat model" : "Agent model"}</CardTitle>

            <CardDescription className="mt-1">
              {isChat
                ? "Required for normal conversations and streaming responses."
                : "Optional model for routing, planning, tools, and agents."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor={`${type}-provider`}>
            Provider
            {!isChat ? (
              <span className="ml-1 text-muted-foreground">(optional)</span>
            ) : null}
          </Label>

          <Select value={value.provider} onValueChange={handleProviderChange}>
            <SelectTrigger id={`${type}-provider`} className="w-full">
              <SelectValue placeholder="Select provider" />
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
          <Label htmlFor={`${type}-model`}>
            Model
            {!isChat ? (
              <span className="ml-1 text-muted-foreground">(optional)</span>
            ) : null}
          </Label>

          <Select
            value={value.modelName}
            onValueChange={handleModelChange}
            disabled={!value.provider}
          >
            <SelectTrigger id={`${type}-model`} className="w-full">
              <SelectValue
                placeholder={
                  value.provider ? "Select model" : "Select provider first"
                }
              />
            </SelectTrigger>

            <SelectContent>
              {selectedProvider?.models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${type}-model-url`}>
            Model URL
            <span className="ml-1 text-muted-foreground">(optional)</span>
          </Label>

          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id={`${type}-model-url`}
              type="url"
              value={value.modelUrl}
              onChange={(event) => {
                updateValue({
                  modelUrl: event.target.value,
                });
              }}
              placeholder="https://api.example.com/v1"
              className="h-10 pl-9"
              autoComplete="url"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Use this for custom or OpenAI-compatible API endpoints.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${type}-api-key`}>
            API key
            {!isChat ? (
              <span className="ml-1 text-muted-foreground">(optional)</span>
            ) : null}
          </Label>

          <div className="relative">
            <Input
              id={`${type}-api-key`}
              type={value.showApiKey ? "text" : "password"}
              value={value.apiKey}
              onChange={(event) => {
                updateValue({
                  apiKey: event.target.value,
                });
              }}
              placeholder="Enter API key"
              className="h-10 pr-11"
              autoComplete="new-password"
            />

            <button
              type="button"
              onClick={() => {
                updateValue({
                  showApiKey: !value.showApiKey,
                });
              }}
              className="absolute right-0 top-0 flex size-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              aria-label={value.showApiKey ? "Hide API key" : "Show API key"}
            >
              {value.showApiKey ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        {isChat ? (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
            <CheckCircle2 className="size-4 shrink-0 text-primary" />

            <span>This configuration is required.</span>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
            Leave empty to use the chat model for agent operations.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
