/** Shared zod request schemas. */
import { z } from 'zod';

export const createSessionSchema = z.object({
  candidateName: z.string().min(1).max(120),
  role: z.string().min(1).max(120),
  seniority: z.string().max(60).optional(),
  jdText: z.string().min(20).max(50000),
  extraContext: z.string().max(10000).optional(),
});

export const generateQuestionsSchema = z.object({
  sessionId: z.string().uuid(),
  selectedCategories: z.array(z.string()).max(20).optional(),
  customCompetencies: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().max(120),
        description: z.string().max(500).optional(),
      })
    )
    .max(20)
    .optional(),
});

export const addQuestionSchema = z.object({
  sessionId: z.string().uuid(),
  question: z.string().min(1).max(2000),
  category: z.string().max(60).optional(),
  rubric: z.string().max(2000).optional(),
  timeGuide: z.string().max(60).optional(),
});

export const evaluateAnswerSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.union([z.string(), z.number()]),
  transcript: z.string().max(20000).optional(),
  manualNotes: z.string().max(10000).optional(),
  notAnswered: z.boolean().optional(),
});

export const skipAnswerSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.union([z.string(), z.number()]),
});

export const generateReportSchema = z.object({
  sessionId: z.string().uuid(),
});

export const matchCandidatesSchema = z.object({
  jdText: z.string().min(20).max(50000),
  role: z.string().max(120).optional(),
  seniority: z.string().max(60).optional(),
  topN: z.coerce.number().int().min(1).max(25).optional(),
});
