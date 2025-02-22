import { Request, Response } from 'express';
import { PrismaService } from '../lib/prisma';
import { ZodError } from 'zod';
import crypto from 'crypto';
import { createCompanySchema, updateCompanySchema } from '../middleware/validators/company-validator';
import { ActivityLogger } from '../utils/activity-logger';

export class CompanyController {
  static async getAllForUser(req: Request, res: Response) {
    try {
      const userId = req.params.user_id;

      const prisma = await PrismaService.getInstance();
      const companies = await prisma.company.findMany({
        where: { user_id: userId },
        include: {
          agents: true,
          calls: {
            orderBy: {
              created_at: 'desc'
            },
            take: 5
          },
          conversations: {
            orderBy: {
              created_at: 'desc'
            },
            take: 5
          }
        }
      });

      return res.status(200).json(companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get single company
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.user;

      const prisma = await PrismaService.getInstance();
      const company = await prisma.company.findFirst({
        where: {
          user_id: id
        },
        include: {
          agents: true,
          calls: {
            orderBy: {
              created_at: 'desc'
            },
            take: 5
          },
          conversations: {
            orderBy: {
              created_at: 'desc'
            },
            take: 5
          }
        }
      });

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      return res.status(200).json(company);
    } catch (error) {
      console.error('Error fetching company:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get companies by user_id
  static async getByUserId(req: Request, res: Response) {
    try {
      const { user_id } = req.params;
      const prisma = await PrismaService.getInstance();
      const companies = await prisma.company.findMany({
        where: { user_id },
        include: {
          agents: true,
          calls: true
        }
      });
      return res.status(200).json(companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create new company
  static async create(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const validatedData = createCompanySchema.parse(req.body);
      const prisma = await PrismaService.getInstance();

      // Generate API key
      const apiKey = crypto.randomBytes(32).toString('hex');

      const data = {
        ...validatedData,
        user_id: userId,
        api_key: apiKey,
        created_at: new Date(),
        updated_at: new Date()
      }

      const company = await prisma.company.create({
        data
      });

      try {
        await ActivityLogger.log({
          user_id: userId,
          action: 'CREATE',
          entity_type: 'COMPANY',
          entity_id: company.id,
          metadata: {
            name: company.name,
            business_name: company.business_name,
            email: company.email
          }
        });
      } catch (error) {
        console.error('Failed to log company creation activity:', error);
      }

      return res.status(201).json(company);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Email or phone number already exists' });
      }
      console.error('Error creating company:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createOrUpdate(req: Request, res: Response) {
    try {
      const { user_id } = req.body;

      if (!user_id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const validatedData = createCompanySchema.parse(req.body);
      const prisma = await PrismaService.getInstance();

      // Check if company exists for the user
      const existingCompany = await prisma.company.findFirst({
        where: { user_id }
      });

      if (existingCompany) {
        // Update existing company
        const updatedCompany = await prisma.company.update({
          where: { id: existingCompany.id },
          data: {
            ...validatedData,
            updated_at: new Date()
          }
        });

        try {
          await ActivityLogger.log({
            user_id: user_id,
            action: 'UPDATE',
            entity_type: 'COMPANY',
            entity_id: existingCompany.id,
            metadata: {
              updated_fields: validatedData
            }
          });
        } catch (error) {
          console.error('Failed to log company update activity:', error);
        }

        return res.status(200).json(updatedCompany);
      } else {
        // Create new company
        const apiKey = crypto.randomBytes(32).toString('hex');
        const newCompany = await prisma.company.create({
          data: {
            ...validatedData,
            user_id,
            api_key: apiKey,
            created_at: new Date(),
            updated_at: new Date()
          }
        });

        try {
          await ActivityLogger.log({
            user_id: user_id,
            action: 'CREATE',
            entity_type: 'COMPANY',
            entity_id: newCompany.id,
            metadata: {
              name: newCompany.name,
              business_name: newCompany.business_name,
              email: newCompany.email
            }
          });
        } catch (error) {
          console.error('Failed to log company creation activity:', error);
        }

        return res.status(201).json(newCompany);
      }
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Email or phone number already exists' });
      }
      console.error('Error creating/updating company:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update company
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const validatedData = updateCompanySchema.parse(req.body);
      const prisma = await PrismaService.getInstance();

      const company = await prisma.company.findFirst({
        where: { id, user_id: userId }
      });

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      const updatedCompany = await prisma.company.update({
        where: { id },
        data: {
          ...validatedData,
          updated_at: new Date()
        }
      });

      try {
        await ActivityLogger.log({
          user_id: userId,
          action: 'UPDATE',
          entity_type: 'COMPANY',
          entity_id: id,
          metadata: {
            updated_fields: validatedData
          }
        });
      } catch (error) {
        console.error('Failed to log company update activity:', error);
      }

      return res.status(200).json(updatedCompany);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Email or phone number already exists' });
      }
      console.error('Error updating company:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete company
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const prisma = await PrismaService.getInstance();

      const company = await prisma.company.findFirst({
        where: { id, user_id: userId }
      });

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      await prisma.company.delete({
        where: { id }
      });

      try {
        await ActivityLogger.log({
          user_id: userId,
          action: 'DELETE',
          entity_type: 'COMPANY',
          entity_id: id,
          metadata: {
            company_name: company.name
          }
        });
      } catch (error) {
        console.error('Failed to log company deletion activity:', error);
      }

      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting company:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Regenerate API key
  static async regenerateApiKey(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const prisma = await PrismaService.getInstance();
      const company = await prisma.company.findFirst({
        where: { id, user_id: userId }
      });

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      const newApiKey = crypto.randomBytes(32).toString('hex');

      const updatedCompany = await prisma.company.update({
        where: { id },
        data: {
          api_key: newApiKey,
          updated_at: new Date()
        }
      });

      await ActivityLogger.log({
        user_id: userId,
        action: 'REGENERATE_API_KEY',
        entity_type: 'COMPANY',
        entity_id: id,
        metadata: {
          company_name: company.name
        }
      });

      return res.status(200).json({ api_key: updatedCompany.api_key });
    } catch (error) {
      console.error('Error regenerating API key:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}