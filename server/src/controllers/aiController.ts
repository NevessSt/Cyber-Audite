import { Request, Response } from 'express';
import { aiService } from '../services/aiService';

export const refineFindingText = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    
    const refined = await aiService.refineDescription(text);
    res.json({ refined });
  } catch (error) {
    res.status(500).json({ error: 'AI refinement failed' });
  }
};

export const suggestRemediation = async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'Title and description required' });

    const remediation = await aiService.generateRemediation(title, description);
    res.json({ remediation });
  } catch (error) {
    res.status(500).json({ error: 'AI remediation failed' });
  }
};
