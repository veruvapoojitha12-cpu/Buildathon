/**
 * SpecForge Course Specification & Output Zod Schemas
 * Validates extracted ASTs, AI CO-PO-PSO alignment generation, and final specforge_output.json.
 */

import { z } from 'zod';

export const CourseOutcomeZodSchema = z.object({
  id: z.string().default('CO1'),
  verb: z.string().default('Analyze'),
  bloomLevel: z.string().default('L4'),
  description: z.string().default(''),
});

export const UnitModuleZodSchema = z.object({
  unit: z.union([z.number(), z.string()]).default(1),
  title: z.string().default(''),
  content: z.string().default(''),
  hours: z.union([z.number(), z.string()]).default(9),
});

export const CoPoMappingZodSchema = z.object({
  coId: z.string(),
  mappings: z.record(z.string(), z.union([z.number(), z.string()])).default({}),
});

export const TeachingHoursRowZodSchema = z.object({
  unit: z.union([z.string(), z.number()]),
  lectureHours: z.union([z.number(), z.string()]).optional().default(0),
  tutorialHours: z.union([z.number(), z.string()]).optional().default(0),
  practicalHours: z.union([z.number(), z.string()]).optional().default(0),
  totalHours: z.union([z.number(), z.string()]).default(0),
});

export const AssessmentItemZodSchema = z.object({
  component: z.string(),
  marksOrWeight: z.union([z.number(), z.string()]),
  category: z.string().optional().default('CIA'),
});

export const CourseSpecZodSchema = z.object({
  courseCode: z.string().default(''),
  title: z.string().default(''),
  department: z.string().default(''),
  credits: z.string().default('3:0:0'),
  courseType: z.string().default('Core'),
  courseOutcomes: z.array(CourseOutcomeZodSchema).default([]),
  units: z.array(UnitModuleZodSchema).default([]),
  coPoMap: z.array(CoPoMappingZodSchema).default([]),
  teachingHoursTable: z.array(TeachingHoursRowZodSchema).default([]),
  assessmentTable: z.array(AssessmentItemZodSchema).default([]),
  resources: z.array(z.string()).default([]),
  blueprintSummary: z.string().optional(),
});

/**
 * AI Response schema for CO-PO-PSO alignment generation and synthesized course summary
 */
export const CoPoPsoGeneratedResultSchema = z.object({
  courseSummary: z.string().min(10),
  outcomes: z.array(
    z.object({
      id: z.string(),
      bloomLevel: z.string(),
      bloomTitle: z.string().optional(),
      verb: z.string().optional(),
      description: z.string(),
      mappings: z.array(
        z.object({
          target: z.string(),
          strength: z.union([z.number(), z.string(), z.null()]).transform((val) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
              const parsed = parseInt(val, 10);
              return isNaN(parsed) ? 0 : parsed;
            }
            return 0;
          }),
          rationale: z.string().optional().default(''),
        })
      ),
    })
  ),
});

export const OutputDefectZodSchema = z.object({
  code: z.string(),
  location: z.object({
    source: z.enum(['spec', 'blueprint', 'template']),
    section: z.number().int().min(1).max(12).nullable(),
    refs: z.array(z.string()),
  }),
  description: z.string(),
  fix: z.string(),
});

/**
 * Output file schema for specforge_output.json
 */
export const SpecforgeOutputZodSchema = z.object({
  input_id: z.string().default('SAMPLE'),
  metadata: z.object({
    course_code: z.string(),
    course_title: z.string(),
    accreditation: z.string().default('NBA_ABET_TIER1'),
    generated_at: z.string(),
  }),
  course_summary: z.string(),
  cos: z.array(
    z.object({
      id: z.string(),
      blooms: z.string(),
      text: z.string(),
    })
  ),
  co_po_pso_map: z.array(
    z.object({
      co_id: z.string(),
      target: z.string(),
      strength: z.number().int().min(1).max(3),
      rationale: z.string(),
    })
  ),
  units_count: z.number().int(),
  defects: z.array(OutputDefectZodSchema).default([]),
});

export type OutputDefectDTO = z.infer<typeof OutputDefectZodSchema>;
export type CourseOutcomeDTO = z.infer<typeof CourseOutcomeZodSchema>;
export type UnitModuleDTO = z.infer<typeof UnitModuleZodSchema>;
export type CourseSpecDTO = z.infer<typeof CourseSpecZodSchema>;
export type CoPoPsoGeneratedResultDTO = z.infer<typeof CoPoPsoGeneratedResultSchema>;
export type SpecforgeOutputDTO = z.infer<typeof SpecforgeOutputZodSchema>;

