import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY
	? new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 10000 })
	: null;

// --- SAFETY CONFIGURATION ---

const PII_REGEX = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  IPV4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  CREDIT_CARD: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
  API_KEY: /(?<![A-Z0-9])[A-Z0-9]{20,40}(?![A-Z0-9])/g // Generic high-entropy string detector
};

const SYSTEM_PROMPTS = {
  REFINE: `You are a Senior Application Security Engineer. 
  Your task is to rewrite vulnerability descriptions to be professional, concise, and impact-focused.
  RULES:
  1. Do not add new facts.
  2. Use standard industry terminology (OWASP, CWE).
  3. Focus on Business Impact.
  4. If the input contains sensitive data (passwords, keys), redact them.`,
  
  REMEDIATE: `You are a Senior Application Security Engineer.
  Provide actionable, step-by-step remediation instructions for the specific technology stack (Node.js/React/Prisma).
  RULES:
  1. Provide code snippets where possible.
  2. Do not explain the vulnerability, just fix it.
  3. Be specific to the framework mentioned.`
};

// --- UTILITIES ---

const stripPII = (text: string): string => {
  let cleanText = text;
  cleanText = cleanText.replace(PII_REGEX.EMAIL, '[REDACTED_EMAIL]');
  cleanText = cleanText.replace(PII_REGEX.IPV4, '[REDACTED_IP]');
  cleanText = cleanText.replace(PII_REGEX.CREDIT_CARD, '[REDACTED_CC]');
  cleanText = cleanText.replace(PII_REGEX.SSN, '[REDACTED_SSN]');
  // Note: API Key detection is aggressive, use with caution in code snippets
  // cleanText = cleanText.replace(PII_REGEX.API_KEY, '[REDACTED_KEY]'); 
  return cleanText;
};

export const aiService = {
  /**
   * Refines the description of a finding to be more professional.
   * SAFETY: Strips PII before sending.
   */
	refineDescription: async (text: string): Promise<string> => {
		if (!openai) {
			return `[MOCK AI] Refined: ${text}`;
		}

		const safeInput = stripPII(text);

		try {
			const response = await openai.chat.completions.create({
				model: 'gpt-4',
				messages: [
					{ role: 'system', content: SYSTEM_PROMPTS.REFINE },
					{ role: 'user', content: safeInput }
				],
				temperature: 0.3,
			});

			const content = response.choices[0]?.message?.content;
			if (typeof content === 'string' && content.trim().length > 0) {
				return content;
			}
			return `[MOCK AI] Refined: ${text}`;
		} catch (error) {
			console.error('OpenAI API error:', error);
			return `[MOCK AI] Refined: ${text}`;
		}
	},

  /**
   * Generates remediation steps based on the finding title and description.
   * SAFETY: Strips PII before sending.
   */
	generateRemediation: async (title: string, description: string): Promise<string> => {
		if (!openai) {
			return `[MOCK AI] Remediation for "${title}":\n1. Update software.\n2. Verify configuration.`;
		}

		const safeTitle = stripPII(title);
		const safeDesc = stripPII(description);

		try {
			const response = await openai.chat.completions.create({
				model: 'gpt-4',
				messages: [
					{ role: 'system', content: SYSTEM_PROMPTS.REMEDIATE },
					{ role: 'user', content: `Issue: ${safeTitle}\nContext: ${safeDesc}` }
				],
				temperature: 0.3,
			});

			const content = response.choices[0]?.message?.content;
			if (typeof content === 'string' && content.trim().length > 0) {
				return content;
			}
			return `[MOCK AI] Remediation for "${title}":\n1. Update software.\n2. Verify configuration.`;
		} catch (error) {
			console.error('OpenAI API error:', error);
			return `[MOCK AI] Remediation for "${title}":\n1. Update software.\n2. Verify configuration.`;
		}
	}
};
