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

const SYSTEM_PROMPT = `You are a business value analyst for enterprise technology investments.
Analyze the provided project data and return a JSON recommendation with this exact structure:
{
  "decision": "proceed" | "defer" | "reject",
  "priority": "critical" | "high" | "medium" | "low",
  "confidence": 0.0-1.0,
  "reasoning": "2-3 sentence explanation",
  "nextSteps": ["action 1", "action 2", "action 3"],
  "risks": ["risk 1", "risk 2"],
  "successMetrics": ["metric 1", "metric 2"]
}

Consider:
- ROI thresholds: >100% = strong, 50-100% = moderate, <50% = weak
- Payback: <12 months = excellent, 12-24 = good, >24 = concerning
- Strategic factors: score 1-5, higher is better
- Market context: positive sentiment supports proceed, negative suggests caution

Return ONLY valid JSON, no markdown or explanation.`;

export async function recommend(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
    const body = (await request.json()) as RecommendationRequest;

    const apiKey = await getApiKey();
    const endpoint = process.env.AZURE_AI_ENDPOINT!;
    const deployment = process.env.AZURE_AI_DEPLOYMENT || "gpt-5-nano";

    const client = new OpenAI({
      apiKey,
      baseURL: `${endpoint}openai/deployments/${deployment}`,
      defaultQuery: { "api-version": "2024-10-21" },
      defaultHeaders: { "api-key": apiKey },
    });

    const userPrompt = `Analyze this technology investment:

**Project:** ${body.projectBasics.projectName} for ${body.projectBasics.customerName}
**Industry:** ${body.projectBasics.industry}
**Solution Area:** ${body.projectBasics.solutionArea}
**Investment:** $${body.projectBasics.investmentAmount.toLocaleString()}
**Timeline:** ${body.projectBasics.timelineMonths} months

**Financial Projections:**
- Conservative: ROI ${body.results.conservative.roi.toFixed(1)}%, NPV $${body.results.conservative.npv.toLocaleString()}, Payback ${body.results.conservative.paybackMonths} months
- Realistic: ROI ${body.results.realistic.roi.toFixed(1)}%, NPV $${body.results.realistic.npv.toLocaleString()}, Payback ${body.results.realistic.paybackMonths} months
- Optimistic: ROI ${body.results.optimistic.roi.toFixed(1)}%, NPV $${body.results.optimistic.npv.toLocaleString()}, Payback ${body.results.optimistic.paybackMonths} months

**Strategic Factors (1-5 scale):**
- Competitive Advantage: ${body.strategicFactors.competitiveAdvantage}
- Innovation Potential: ${body.strategicFactors.innovationPotential}
- Strategic Alignment: ${body.strategicFactors.strategicAlignment}
- Risk Tolerance: ${body.strategicFactors.riskTolerance}
- Market Timing: ${body.strategicFactors.marketTiming}

${body.marketContext ? `**Market Context:**
- Stock sentiment: ${body.marketContext.stockData?.changePercent ?? "N/A"}%
- Earnings themes: ${body.marketContext.earningsInsights?.themes?.join(", ") ?? "N/A"}` : ""}

Provide your recommendation as JSON.`;

    const completion = await client.chat.completions.create({
      model: deployment,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content || "";
    
    let recommendation: RecommendationResponse;
    try {
      recommendation = JSON.parse(content);
    } catch {
      context.warn("Failed to parse AI response, using fallback");
      recommendation = {
        decision: body.results.realistic.roi > 50 ? "proceed" : "defer",
        priority: body.results.realistic.roi > 100 ? "high" : "medium",
        confidence: 0.7,
        reasoning: "Analysis completed with rule-based fallback.",
        nextSteps: ["Review financial projections", "Validate assumptions with stakeholders"],
        risks: ["Market conditions may change", "Implementation timeline risk"],
        successMetrics: ["Achieve projected ROI", "Complete within timeline"],
      };
    }

    return {
      status: 200,
      jsonBody: recommendation,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (error) {
    context.error("Recommend function error:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to generate recommendation" },
      headers: { "Access-Control-Allow-Origin": "*" },
    };
  }
}

app.http("recommend", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: recommend,
});
