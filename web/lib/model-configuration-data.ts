export interface ModelFormState {
  provider: string;
  modelName: string;
  modelUrl: string;
  apiKey: string;
  showApiKey: boolean;
}

export interface ModelConfigurationResponse {
  id: string;
  user_id: string;
  model_type: string;
  provider: string;
  model_name: string;
  model_url: string | null;
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

export interface ProviderConfiguration {
  label: string;
  value: string;
  models: string[];
}

export const PROVIDERS: ProviderConfiguration[] = [
  // {
  //   label: "OpenAI",
  //   value: "openai",
  //   models: ["gpt-4.1", "gpt-4.1-mini", "gpt-4o", "gpt-4o-mini"],
  // },
  {
    label: "Groq",
    value: "groq",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
  },
  {
    label: "Google",
    value: "google",
    models: ["gemini-2.5-flash", "gemini-2.5-pro"],
  },
  // {
  //   label: "Anthropic",
  //   value: "anthropic",
  //   models: ["claude-sonnet-4", "claude-3-5-haiku-latest"],
  // },
  // {
  //   label: "OpenAI Compatible",
  //   value: "openai-compatible",
  //   models: ["custom-model"],
  // },
];

export function createEmptyModel(): ModelFormState {
  return {
    provider: "",
    modelName: "",
    modelUrl: "",
    apiKey: "",
    showApiKey: false,
  };
}
