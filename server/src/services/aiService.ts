import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI only if API key is present
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export const aiService = {
  /**
   * Refines the description of a finding to be more professional.
   */
  refineDescription: async (text: string): Promise<string> => {
    if (!openai) {
      console.warn('OpenAI API key not found. Returning original text.');
      return `[MOCK AI] Refined: ${text}`;
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a cybersecurity expert. Rewrite the following finding description to be professional, concise, and clear. Focus on the risk and impact.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || text;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to refine text');
    }
  },

  /**
   * Generates remediation steps based on the finding title and description.
   */
  generateRemediation: async (title: string, description: string): Promise<string> => {
    if (!openai) {
      return `[MOCK AI] Remediation for "${title}":\n1. Update software.\n2. Verify configuration.`;
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a cybersecurity expert. Provide step-by-step remediation instructions for the following security issue.'
          },
          {
            role: 'user',
            content: `Issue: ${title}\nContext: ${description}`
          }
        ],
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'No remediation generated.';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate remediation');
    }
  }
};
