/**
 * AI Client - Connects React app to Azure Functions backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:7071/api";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

interface RecommendationRequest {
  projectBasics: {
    customerName: string;
    projectName: string;
    solutionArea: string;
    industry: string;
    investmentAmount: number;
    timelineMonths: number;
  };
  results: {
    conservative: { roi: number; npv: number; paybackMonths: number };
    realistic: { roi: number; npv: number; paybackMonths: number };
    optimistic: { roi: number; npv: number; paybackMonths: number };
  };
  strategicFactors: {
    competitiveAdvantage: number;
    innovationPotential: number;
    strategicAlignment: number;
    riskTolerance: number;
    marketTiming: number;
  };
  marketContext?: {
    stockData?: { price: number; change: number; changePercent: number };
    earningsInsights?: { sentiment: string; themes: string[] };
  };
}

interface RecommendationResponse {
  decision: "proceed" | "defer" | "reject";
  priority: "critical" | "high" | "medium" | "low";
  confidence: number;
  reasoning: string;
  nextSteps: string[];
  risks: string[];
  successMetrics: string[];
}

/**
 * Send a chat message to the AI backend
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat API error: ${response.status}`);
  }

  const data: ChatResponse = await response.json();
  return data.choices[0]?.message?.content || "";
}

/**
 * Get AI-powered recommendation for a business case
 */
export async function getAIRecommendation(
  request: RecommendationRequest
): Promise<RecommendationResponse> {
  const response = await fetch(`${API_BASE_URL}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Recommend API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Check if the AI backend is available
 */
export async function checkAIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "OPTIONS",
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Generate narrative explanation for analysis results
 */
export async function generateNarrative(
  context: string,
  data: Record<string, unknown>
): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a business analyst writing executive summaries. Be concise, professional, and actionable. Write in plain English, not bullet points.`,
    },
    {
      role: "user",
      content: `${context}\n\nData:\n${JSON.stringify(data, null, 2)}\n\nWrite a 2-3 sentence executive summary.`,
    },
  ];

  return sendChatMessage(messages, { temperature: 0.5, maxTokens: 200 });
}
