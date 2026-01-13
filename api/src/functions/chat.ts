import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import OpenAI from "openai";

const credential = new DefaultAzureCredential();
const keyVaultUrl = process.env.KEY_VAULT_URL!;
const secretClient = new SecretClient(keyVaultUrl, credential);

let cachedApiKey: string | null = null;

async function getApiKey(): Promise<string> {
  if (!cachedApiKey) {
    const secret = await secretClient.getSecret("azure-ai-foundry");
    cachedApiKey = secret.value!;
  }
  return cachedApiKey;
}

interface ChatRequest {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  maxTokens?: number;
}

export async function chat(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    };
  }

  try {
    const body = (await request.json()) as ChatRequest;

    if (!body.messages || !Array.isArray(body.messages)) {
      return {
        status: 400,
        jsonBody: { error: "Invalid request: messages array required" },
        headers: { "Access-Control-Allow-Origin": "*" },
      };
    }

    const apiKey = await getApiKey();
    const endpoint = process.env.AZURE_AI_ENDPOINT!;
    const deployment = process.env.AZURE_AI_DEPLOYMENT || "gpt-5-nano";

    const client = new OpenAI({
      apiKey,
      baseURL: `${endpoint}openai/deployments/${deployment}`,
      defaultQuery: { "api-version": "2024-10-21" },
      defaultHeaders: { "api-key": apiKey },
    });

    const completion = await client.chat.completions.create({
      model: deployment,
      messages: body.messages,
      temperature: body.temperature ?? 0.7,
      max_tokens: body.maxTokens ?? 1000,
    });

    return {
      status: 200,
      jsonBody: completion,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (error) {
    context.error("Chat function error:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to process request" },
      headers: { "Access-Control-Allow-Origin": "*" },
    };
  }
}

app.http("chat", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: chat,
});
