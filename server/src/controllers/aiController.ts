import { Response } from 'express';
import { aiService } from '../services/aiService';
import { AuthRequest } from '../middleware/auth';
import { logAction } from '../services/auditLogService';

export const refineFindingText = async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    
    const refined = await aiService.refineDescription(text);

    await logAction(req.user!.userId, 'AI_REFINE', 'System', 'AI_SERVICE', { length: text.length }, req);

    res.json({ refined });
  } catch (error) {
    res.status(500).json({ error: 'AI refinement failed' });
  }
};

export const suggestRemediation = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'Title and description required' });

    const remediation = await aiService.generateRemediation(title, description);

    await logAction(req.user!.userId, 'AI_REMEDIATE', 'System', 'AI_SERVICE', { title }, req);

    res.json({ remediation });
  } catch (error) {
    res.status(500).json({ error: 'AI remediation failed' });
  }
};
