export interface Provider {
  value: string;
  label: string;
  models: string[];
}

export interface ModelFormState {
  provider: string;
  modelName: string;
  apiKey: string;
  showApiKey: boolean;
}

export interface ModelConfigurationResponse {
  id: string;
  user_id: string;
  model_type: "chat" | "agent";
  provider: string;
  model_name: string;
  api_key: string;
  created_at: string;
  updated_at: string;
}

export interface ConfigurationsResponse {
  chat: ModelConfigurationResponse | null;
  agent: ModelConfigurationResponse | null;
}

export interface ApiErrorResponse {
  detail?: string | unknown;
}

export const PROVIDERS: Provider[] = [
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

export const createEmptyModel = (): ModelFormState => ({
  provider: "",
  modelName: "",
  apiKey: "",
  showApiKey: false,
});
