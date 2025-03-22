import { z } from 'zod';

export const createAgentSchema = z.object({
    user_id: z.string(),
    name: z.string().min(1).max(255),
    type: z.string().min(1).max(255),
    is_active: z.boolean().default(true),
    company_id: z.string().nullable().optional(),
    prompt: z.string(),
    additional_context: z.any().optional().nullable(),
    advanced_settings: z.any().optional().nullable(),
    confidence_threshold: z.number().min(0).max(1).optional().default(0.7),
    files: z.array(z.string().max(255)).default([]),
    template_id: z.string().max(255).optional().nullable(),
    knowledge_base_ids: z.array(z.string()).default([]),
    database_integration_ids: z.array(z.string()).default([]),
    search_config: z.any().optional().nullable(),
    max_response_tokens: z.number().optional(),
    temperature: z.number().optional(),
    image_processing_enabled: z.boolean().optional(),
    image_processing_config: z.any().optional().nullable()
});

// For update operations, make all fields optional
export const updateAgentSchema = createAgentSchema.partial();