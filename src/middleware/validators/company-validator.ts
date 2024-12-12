import { z } from 'zod';

export type CompanySettings = {
  notification_preferences?: {
    email?: boolean;
    sms?: boolean;
  };
  working_hours?: {
    start: string;
    end: string;
    timezone: string;
  };
};

export const createCompanySchema = z.object({
  name: z.string().min(1).max(255),
  business_name: z.string().min(1).max(255),
  email: z.string().email(),
  address: z.string().min(1).max(255),
  website: z.string().url().max(255).optional(),
  logo: z.string().max(255).optional(),
  prompt_templates: z.any().optional(),
  phone_number: z.string().regex(/^\+?[1-9]\d{1,19}$/).optional(),
  settings: z.object({
    notification_preferences: z.object({
      email: z.boolean(),
      sms: z.boolean()
    }).optional(),
    working_hours: z.object({
      start: z.string(),
      end: z.string(),
      timezone: z.string()
    }).optional()
  }).optional(),
});

export const updateCompanySchema = createCompanySchema.partial();