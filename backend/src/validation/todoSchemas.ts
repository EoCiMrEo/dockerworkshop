import { z } from 'zod';

export const prioritySchema = z.enum(['low', 'medium', 'high']);

export const createTodoSchema = z.object({
  title: z.string().min(1, 'title is required').max(120, 'title is too long'),
  description: z.string().max(2000).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  priority: prioritySchema.default('medium'),
  completed: z.boolean().optional().default(false)
});

export const updateTodoSchema = createTodoSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required for update'
);

export const todoFilterSchema = z.object({
  status: z.enum(['all', 'active', 'completed']).optional().default('all'),
  priority: prioritySchema.optional(),
  search: z.string().optional(),
  dueFrom: z.string().datetime().optional(),
  dueTo: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z.enum(['createdAt', 'dueDate', 'priority']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});
