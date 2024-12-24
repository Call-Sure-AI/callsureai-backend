import { z } from 'zod';

export const createAgentSchema = z.object({
    user_id: z.string(),
    name: z.string().min(1).max(255),
    type: z.string().min(1).max(255),
    company_id: z.string().uuid().optional(),
    prompt: z.string(),
    additional_context: z.any().optional(),
    advanced_settings: z.any().optional(),
    is_active: z.boolean().optional(),
    confidence_threshold: z.number().min(0).max(1).optional(),
    files: z.array(z.string().max(255)),
    template_id: z.string().max(255).optional()
});

export const updateAgentSchema = createAgentSchema.partial();