import { Lead } from "../types";

async function callOllama(prompt) {
  const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
  const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1";
  const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gpt-oss:120b-cloud";

  console.log("🤖 AI Engine: Sending request to Ollama...", { model: OLLAMA_MODEL, prompt: prompt.substring(0, 100) + "..." });

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OLLAMA_API_KEY}`,
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    console.log("✅ AI Engine: Received response", { length: content.length });
    return content;
  } catch (error) {
    console.error("❌ AI Engine: Fetch Error", error);
    throw error;
  }
}


const PROFESSIONAL_EXPERIENCE = `
[Agentic & Multi-Agent Systems]: Architected Neo-Council, a multi-agent governance layer for Web3. Built custom VS Code AI assistants using LangGraph and MCP servers. Expert in agent orchestration and memory management.
[Financial & Forecasting AI]: Built Neo-Investment quant engines (Monte Carlo, VaR) and Apex Prediction (LightGBM, NHITS) for complex time-series forecasting with SHAP explainability.
[AI Security & Infrastructure]: Developed MSAP (RAG-powered vulnerability reporting) and Neo-Defense (MLOps for threat detection). Deep experience in deploying LLMs on AWS EC2 GPU via Docker/CI/CD.
[Software Engineering Foundation]: Transitioned legacy JEE monoliths to Spring Boot microservices. Strong Java/Python/TypeScript background.
`;

const PERSONAL_DEFINITION = `I am an AI Engineer focused on building agentic RAG systems and multi agent architectures that move beyond simple automation to production ready decision support. I specialize in deploying end to end AI pipelines that turn complex data into structured, actionable insights.`;

export async function generateOutreachEmail(lead: Lead, companyContext: string) {
  const prompt = `
# ROLE
You are Yosra Omrane, a world-class, visionary AI Software Engineer. You write cold outreach emails to tech leaders that are so insightful they cannot be ignored. You don't ask for a job—you propose technical value and demonstrate peer-level engineering acumen to secure an interview.

# INPUT DATA
- Lead: ${lead.name}, ${lead.role} at ${lead.company}
- Company Context: ${companyContext}
- My Background: ${PROFESSIONAL_EXPERIENCE}
- Personal Definition: ${PERSONAL_DEFINITION}

# STEP 1: ANALYZE (Internal Monologue)
1. Deduce ${lead.company}'s core product and their most likely current AI/engineering bottleneck.
2. Formulate a highly specific technical hypothesis about how agentic workflows, RAG, or MLOps could solve that bottleneck.
3. Select ONE project from my background that perfectly demonstrates I have already built this solution.

# STEP 2: COMPOSE THE EMAIL
Write a highly compelling outreach email.

## Subject Line
Must be a "pattern interrupt" that a busy executive would open. 
Examples: "Agentic architecture for ${lead.company}'s [Product]", "Scaling [Specific Tech] at ${lead.company}", or a thought-provoking technical question.

## Paragraph 1: The Hook & Hypothesis
Start with a direct, insightful observation about their tech or market. Prove immediately that you understand their deepest technical challenges.
Example: "The way ${lead.company} is handling [problem] is fascinating, but scaling that logic usually creates bottlenecks in [specific area]."

## Paragraph 2: The Core Identity (Verbatim Integration)
You MUST include my Personal Definition exactly as written here, seamlessly integrated:
"${PERSONAL_DEFINITION}"
Follow it with a sentence connecting this identity directly to the hypothesis you formed for ${lead.company}.

## Paragraph 3: The Proof of Competence
Link your most relevant project. Use the phrase "The core challenge mirrors yours." 
Briefly describe the specific architecture (e.g., LangGraph, MCP, LightGBM) you built in that project, and how it directly de-risks their roadmap. Show, don't just tell.

## Paragraph 4: The Call to Action
Close with a soft, collaborative call to action indicating that you have attached your resume and are open to joining their team.
You MUST NOT ask for a "15-minute call" or claim you "sketched a roadmap". Use this exact phrasing or very similar:
"I have attached my resume to provide more details about my background. If you see a potential fit for me to join your team and collaborate on these challenges, I would be very open to a discussion."

# CONSTRAINTS
- Greeting: "Dear ${lead.name},"
- Signature: "Best regards,\nYosra Omrane\nAI Software Engineer"
- NO fluff ("I hope you are well", "My name is").
- DO NOT ask for a call, meeting, or claim to have sketched a roadmap.
- ABSOLUTELY NO dashes (-) or bullet points. Use beautifully flowing paragraphs.
- Max 200 words. Be concise, punchy, and deeply technical.
- Tone: Peer-to-peer, visionary, elite, yet highly pragmatic.

# OUTPUT FORMAT
Subject: [Subject]
[Email Body]
`;
  try {
    let text = await callOllama(prompt);

    // Find where the actual email starts (ignore search tool logs)
    const subjectIndex = text.search(/^Subject:/im);
    if (subjectIndex !== -1) {
      text = text.substring(subjectIndex).trim();
    }

    const lines = text.split('\n');
    const finalSubject = lines[0].replace(/^Subject:\s*/i, '').trim();
    const finalBody = lines.slice(1).join('\n').trim();
    
    return { subject: finalSubject, body: finalBody };
  } catch (error) {
    console.error("Ollama Generation Error:", error);
    throw error;
  }
}

export async function researchCompany(company: string, website: string) {
  const prompt = `[USE WEB SEARCH] Research and provide a brief (2-3 sentence) summary of what this company does, its main product, and a recent milestone or news if possible. 
Company: ${company}
Website: ${website}

Return only the summary.`;

  try {
    console.log("DEBUG: Calling Ollama for research...");
    const text = await callOllama(prompt);
    return text.trim() || "";
  } catch (error) {
    console.error("Ollama Research Error:", error);
    throw error;
  }
}
