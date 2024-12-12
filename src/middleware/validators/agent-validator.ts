import { z } from 'zod';

export const createAgentSchema = z.object({
    name: z.string().min(1).max(255),
    type: z.string().min(1).max(255),
    company_id: z.string().uuid().optional(),
    prompt: z.string(),
    additional_context: z.any().optional(),
    confidence_threshold: z.number().min(0).max(1).optional(),
    files: z.array(z.string().max(255)),
    template_id: z.string().max(255).optional()
});

export const updateAgentSchema = createAgentSchema.partial();