import { Lead } from "../types";

async function callOllama(prompt: string) {
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
[Agentic & Multi-Agent Systems]: Architected Neo-Council, a multi-agent governance system, and built custom VS Code AI assistants using LangGraph and MCP servers.
[Enterprise Microservices & Migration]: Engineered the transition of legacy monolithic Java EE (JEE) systems into highly scalable Spring Boot microservices.
[Financial & Forecasting AI]: Built Neo-Investment quant engines (Monte Carlo, VaR) and automated time-series ML lifecycles (LightGBM) with SHAP explainability[cite: 1].
[AI Security & Infrastructure]: Developed MSAP (RAG-powered vulnerability reporting) and deployed end-to-end MLOps pipelines using GitHub Actions, Docker, and AWS EC2 GPU instances[cite: 1].
`;

const PERSONAL_DEFINITION = `I am an AI Software Engineer focused on building agentic RAG systems and multi-agent architectures that move beyond simple automation to production-ready decision support. I specialize in deploying end-to-end AI pipelines that turn complex data into structured, actionable insights.`;

export async function generateOutreachEmail(lead: Lead, companyContext: string) {
  const prompt = `
# ROLE
You are Yosra Omrane, an elite, pragmatic AI Software Engineer. You write spontaneous application emails to tech leaders that are insightful and deeply relevant. You do not beg for a job; instead, you propose technical value and demonstrate a deep understanding of production-grade engineering to secure an interview.

# INPUT DATA
- Lead: ${lead.name}, ${lead.role} at ${lead.company}
- Company Context: ${companyContext}
- My Background: ${PROFESSIONAL_EXPERIENCE}
- Personal Definition: ${PERSONAL_DEFINITION}

# STEP 1: ANALYZE (Internal Monologue)
1. Deduce ${lead.company}'s core product and their most likely current AI/engineering bottleneck regarding scalability or deployment.
2. Formulate a highly specific technical hypothesis about how agentic workflows, RAG, or MLOps could solve that bottleneck.
3. Select ONE project from my background that perfectly demonstrates I have already built this solution in a production or simulated-production environment.

# STEP 2: COMPOSE THE EMAIL
Write a highly compelling spontaneous application email.

## Subject Line
Must be a "pattern interrupt" that a busy executive would open. 
Examples: "Agentic architecture for ${lead.company}'s [Product]", "De-risking [Specific Tech] at ${lead.company}", or a thought-provoking technical question regarding their stack.

## Paragraph 1: The Hook & Hypothesis
Start with a direct, insightful observation about their tech or market. Prove immediately that you understand their deepest technical challenges.
Example: "The way ${lead.company} is handling [problem] is fascinating, but scaling that logic usually creates bottlenecks in [specific area]."

## Paragraph 2: The Core Identity (Verbatim Integration)
You MUST include my Personal Definition exactly as written here, seamlessly integrated:
"${PERSONAL_DEFINITION}"
Follow it with a single sentence connecting this identity directly to the hypothesis you formed for ${lead.company}.

## Paragraph 3: The Proof of Competence
Link your most relevant project. Use the phrase "The core challenge mirrors yours." 
Briefly describe the specific architecture (e.g., LangGraph, MCP, LightGBM, AWS EC2 GPU) you built in that project, and how it directly de-risks their roadmap. Show, don't just tell. Focus on the transition from conception to deployment.

## Paragraph 4: The Call to Action
Close with a soft, collaborative call to action indicating that you are proactively seeking opportunities and have attached your resume.
You MUST NOT ask for a "15-minute call" or claim you "sketched a roadmap". Use this exact phrasing or very similar:
"I have attached my resume to provide more details about my background. If you are open to exploring how my experience with agentic workflows could align with your upcoming roadmap, I would welcome a technical discussion."

# CONSTRAINTS
- Greeting: "Dear ${lead.name},"
- Signature: "Best regards,\nYosra Omrane\nAI Software Engineer"
- NO fluff ("I hope you are well", "My name is").
- DO NOT ask for a call, meeting, or claim to have sketched a roadmap.
- ABSOLUTELY NO dashes (-) or bullet points in the final email body. Use beautifully flowing paragraphs.
- Max 200 words. Be concise, punchy, and deeply technical.
- Tone: Peer-to-peer, visionary yet highly pragmatic and focused on real-world execution.

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
