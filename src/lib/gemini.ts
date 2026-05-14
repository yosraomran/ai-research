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
You are Yosra Omrane, a world-class AI Software Engineer. Your writing style is technical, ambitious, and deeply researched. You don't just "apply"—you propose a vision for how you can accelerate a company's roadmap.

# INPUT DATA
- Lead: ${lead.name}, ${lead.role} at ${lead.company}
- Company Context: ${companyContext}
- My Background: ${PROFESSIONAL_EXPERIENCE}
- Personal Definition: ${PERSONAL_DEFINITION}

# STEP 1: ANALYZE (Internal Monologue)
1. Identify the company's "North Star" (e.g., if it's LXA, it's manufacturing efficiency via Digital Twins).
2. Identify the "Technical Hurdle" they likely face (e.g., scaling decision logic, real-time data synthesis).
3. Select the most "Attractive" project from my background that solves a similar technical hurdle.

# STEP 2: COMPOSE THE EMAIL
Write a high-motivation email following this structure:

## Subject Line:
Must be a "pattern interrupt." Do NOT use "Job Application." 
Use: "[Specific Tech Idea] for ${lead.company}’s [Product/Mission]" or "[Technical Insight] regarding ${lead.company}'s AI strategy."

## Paragraph 1: The Obsession Hook
Show them you aren't just looking for a job; you are obsessed with their specific problem. 
Mention a specific detail from the context (e.g., "The way ${lead.company} leverages digital twins to bridge the gap between design and physical production is the most compelling use of AI in manufacturing right now.")
The intro should be direct and concise—not too long, but showing depth.

## Paragraph 2: The Ambition & Motivation
State clearly why you want to build *with them*. This paragraph MUST include the Personal Definition **verbatim** (or use it as the opening sentence). Place the personal-definition at the start of the paragraph followed by one sentence that ties this motivation directly to ${lead.company}'s work.
Example required opening sentence (use this exact text or verbatim Personal Definition):
"I am an AI Engineer focused on building agentic RAG systems and multi agent architectures that move beyond simple automation to production ready decision support. I specialize in deploying end to end AI pipelines that turn complex data into structured, actionable insights."

## Paragraph 3: The "Dynamic Proof"
Link your most relevant project. Use "The core challenge mirrors yours." 
Select the most relevant project from: ${PROFESSIONAL_EXPERIENCE}.
Highlight how your technical solution (e.g., LangGraph, MLOps, forecasting) solves their specific scaling hurdle.

## Paragraph 4: The Bold Ask
"I’d love to show you my resume and discuss how my experience with multi-agent orchestration could support your current roadmap."

# CONSTRAINTS
- Greeting: "Dear ${lead.name},"
- Signature: "Best regards,\nYosra Omrane\nAI Software Engineer"
- No "I hope you are doing well."
- No "My name is Yosra."
- ABSOLUTELY NO dashes or bullet points. Use clean, flowing paragraphs.
- Intro must be direct and technical.
- Max 150 words.
- Tone: Elite, technical, vision-driven.

Note: Increase max words to allow for the full personal-definition + technical detail.
Max 200 words.

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
    const subject = lines[0].replace(/^Subject:\s*/i, '').trim();
    const body = lines.slice(1).join('\n').trim();
    // Post-process body to enforce structure and include PERSONAL_DEFINITION verbatim
    function enforceStructure(leadName: string, rawBody: string) {
      const greeting = `Dear ${leadName},`;

      // Normalize line endings and collapse excess blank lines
      let b = rawBody.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

      // Ensure greeting at top
      if (!b.startsWith(greeting)) {
        b = `${greeting}\n\n${b}`;
      }

      // Split into paragraphs by double newlines
      let paras = b.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

      // Remove greeting from paras if present as first paragraph
      if (paras[0] === greeting) {
        paras = paras.slice(1);
      }

      // Ensure we have at least 4 paragraphs; if fewer, try to split by sentences
      if (paras.length < 4) {
        const allText = paras.join(' ');
        const sentences = allText.match(/[^.!?]+[.!?]?/g) || [allText];
        const target = 4;
        const newParas: string[] = [];
        let i = 0;
        for (let p = 0; p < target; p++) {
          let part = '';
          // distribute sentences roughly evenly
          const take = Math.ceil((sentences.length - i) / (target - p));
          for (let t = 0; t < take && i < sentences.length; t++, i++) {
            part += (part ? ' ' : '') + sentences[i].trim();
          }
          newParas.push(part.trim());
        }
        paras = newParas;
      }

      // Ensure paragraph 2 starts with the PERSONAL_DEFINITION verbatim
      const personal = PERSONAL_DEFINITION.trim();
      if (!paras[1].startsWith(personal)) {
        paras[1] = `${personal} ${paras[1]}`.trim();
      }

      // Ensure signature at the end
      const signature = `Best regards,\nYosra Omrane\nAI Software Engineer`;
      const lastPara = paras[paras.length - 1];
      if (!lastPara.includes('Best regards') && !lastPara.includes('Best,') && !lastPara.includes('Regards')) {
        paras.push(signature);
      } else if (!paras[paras.length - 1].includes('Yosra')) {
        paras[paras.length - 1] = `${paras[paras.length - 1]}\n\n${signature}`;
      }

      // Reassemble: greeting + paragraphs separated by blank line
      const finalBody = `${greeting}\n\n${paras.join('\n\n')}`;

      // Enforce max words
      const maxWords = 200;
      const words = finalBody.split(/\s+/);
      if (words.length > maxWords) {
        return words.slice(0, maxWords).join(' ') + '...\n\n' + signature;
      }

      return finalBody;
    }

    const finalBody = enforceStructure(lead.name, body);
    const finalSubject = subject || `${lead.company} — Agentic RAG & multi-agent systems`;
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
