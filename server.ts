/**
 * SpecForge Express Server Entry Point
 * 
 * - Serves GET /api/v1/health returning { success: true, data: { status: 'up' } }
 * - Serves GET /api/v1/llm-check verifying x-llm-* headers statelessly
 * - Mounts Vite middleware in development on port 3000
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { extractDocumentContent } from './server/extractor';
import { handleLLMCheck, generateJson } from './server/llm';
import { handleGenerate } from './server/index';
import { generateCoPoPsoAlignment } from './server/copo';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isDev = process.env.NODE_ENV !== 'production';

  app.use(express.json());

  // CORS & transient header exposure
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-llm-provider, x-llm-key, x-llm-model, x-user-role');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health Check Route
  app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'up',
      },
    });
  });

  // LLM Check Route
  app.get('/api/v1/llm-check', (req, res) => {
    return handleLLMCheck(req, res);
  });

  // Document Upload & Structured Parse Route
  app.post(
    '/api/v1/parse',
    upload.fields([
      { name: 'spec', maxCount: 1 },
      { name: 'blueprint', maxCount: 1 },
    ]),
    async (req, res) => {
      try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const specFile = files?.['spec']?.[0];
        const blueprintFile = files?.['blueprint']?.[0];

        if (!specFile) {
          return res.status(400).json({
            success: false,
            error:
              'Missing required field "spec". Please upload an existing course specification document (.docx, .pdf, .html, or .doc).',
          });
        }

        // 1. Extract course specification document
        const specDoc = await extractDocumentContent(specFile.buffer, specFile.originalname);

        // 2. Extract optional question-paper blueprint
        let blueprintDoc;
        if (blueprintFile) {
          blueprintDoc = await extractDocumentContent(
            blueprintFile.buffer,
            blueprintFile.originalname
          );
        }

        const schemaDescription = `Course Specification Schema:
{
  "courseCode": string,
  "title": string,
  "department": string,
  "credits": string (e.g. "3:1:0"),
  "courseType": string (e.g. "Professional Core"),
  "courseOutcomes": array of { "id": "CO1", "verb": "Analyze", "bloomLevel": "L4", "description": string },
  "units": array of { "unit": number, "title": string, "content": string, "hours": number },
  "coPoMap": array of { "coId": string, "mappings": Record<string, number> },
  "teachingHoursTable": array of { "unit": number, "lectureHours": number, "tutorialHours": number, "practicalHours": number, "totalHours": number },
  "assessmentTable": array of { "component": string, "marksOrWeight": number, "category": string },
  "resources": array of string
}`;

        const combinedText = `${specDoc.rawText}\n\n${specDoc.tableText || ''}`;
        const blueprintText = blueprintDoc
          ? `${blueprintDoc.rawText}\n\n${blueprintDoc.tableText || ''}`
          : undefined;

        // 3. Call generateJson from server/llm.ts
        const result = await generateJson(
          req,
          'Extract all course outcomes with leading verbs, bloom levels, units, credit hours, and CO-PO matrix.',
          schemaDescription,
          combinedText,
          blueprintText
        );

        return res.status(200).json({
          success: true,
          data: result.data,
          source: result.source,
          meta: {
            specFilename: specFile.originalname,
            specSize: specFile.size,
            blueprintFilename: blueprintFile?.originalname,
            textChars: combinedText.length,
          },
        });
      } catch (err: any) {
        console.error('Error during syllabus parse:', err);
        return res.status(400).json({
          success: false,
          error: err.message || 'Failed to parse syllabus document.',
        });
      }
    }
  );

  // Zero-Click Scoring Pipeline Route (Invoked by Accreditation Evaluators)
  app.post(
    '/api/v1/generate',
    upload.fields([
      { name: 'spec', maxCount: 1 },
      { name: 'blueprint', maxCount: 1 },
    ]),
    (req, res) => handleGenerate(req, res)
  );

  // Interactive CO-PO-PSO Alignment & Summary Rewrite Endpoint
  app.post('/api/v1/align', async (req, res) => {
    try {
      const { courseTitle, courseCode, outcomes, units } = req.body;
      const result = await generateCoPoPsoAlignment(
        req,
        courseTitle || 'Course Specification',
        courseCode || 'CS304',
        outcomes || [],
        units || []
      );
      return res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      console.error('Error in /api/v1/align:', err);
      return res.status(500).json({ success: false, error: err.message || 'Alignment generation failed.' });
    }
  });

  // =========================================================================
  // WORKFLOW GOVERNANCE & RBAC ENFORCEMENT ENGINE
  // States: Draft, Submitted, Under Review, Pending HOD, Approved, Returned
  // Rules:
  // - Author submits from Draft
  // - Reviewer opens it (Under Review) and either forwards to HOD or returns with comment
  // - HOD approves or returns with comment
  // - Returned spec goes back to Author, who edits and resubmits
  // - ONLY the Author can edit content, and ONLY in Draft or Returned (HTTP 403 otherwise)
  // - Reviewer and HOD can add comments per section
  // - Log every state change with user, role, time, and comment
  // =========================================================================

  interface ServerAuditLog {
    id: string;
    stage: string;
    timestamp: string;
    actor: string;
    role: string;
    action: string;
    note: string;
  }

  interface ServerSectionComment {
    id: string;
    sectionNumber: number;
    sectionTitle: string;
    authorName: string;
    authorRole: string;
    timestamp: string;
    comment: string;
    resolved: boolean;
  }

  const serverWorkflowState = {
    status: 'draft' as 'draft' | 'submitted' | 'under_review' | 'pending_hod' | 'approved' | 'returned',
    auditLog: [
      {
        id: 'log-1',
        stage: 'draft',
        timestamp: '2025-08-12 10:30',
        actor: 'Dr. Sarah Lin (Course Author)',
        role: 'author',
        action: 'Initial Specification Draft Created',
        note: 'Imported syllabus source docx and extracted AST course outcomes and units.',
      },
      {
        id: 'log-2',
        stage: 'submitted',
        timestamp: '2025-08-14 14:15',
        actor: 'Dr. Sarah Lin (Course Author)',
        role: 'author',
        action: 'Submitted for Departmental Review',
        note: 'Completed Bloom level mapping and initial CO-PO alignment matrix.',
      },
      {
        id: 'log-3',
        stage: 'under_review',
        timestamp: '2025-08-18 11:00',
        actor: 'Prof. David Marcus (Curriculum Reviewer)',
        role: 'reviewer',
        action: 'Audit Review Completed with Notes',
        note: 'Verified CO-PO matrix. Recommended clarifying tutorial contact hours and adding modern approximation references.',
      },
      {
        id: 'log-4',
        stage: 'pending_hod',
        timestamp: '2025-08-20 09:45',
        actor: 'Prof. David Marcus (Curriculum Reviewer)',
        role: 'reviewer',
        action: 'Forwarded to HOD for BOS Endorsement',
        note: 'Pre-audit defects reduced to 3 non-blocking items. Ready for Board of Studies consideration.',
      },
    ] as ServerAuditLog[],
    sectionComments: [
      {
        id: 'comment-1',
        sectionNumber: 3,
        sectionTitle: 'Section 3: Credit Breakdown & Lab Hours',
        authorName: 'Prof. David Marcus',
        authorRole: 'reviewer',
        timestamp: '2h ago',
        comment: 'ABET Computing criteria requires explicit 1-credit laboratory documentation if 4 credits are allocated. Please specify whether 25 hours are devoted to practical algorithm prototyping.',
        resolved: false,
      },
      {
        id: 'comment-2',
        sectionNumber: 5,
        sectionTitle: 'Section 5: Course Learning Outcome CLO-3',
        authorName: 'Dr. Elena Rostova',
        authorRole: 'hod',
        timestamp: 'Yesterday',
        comment: "Bloom's Taxonomy verb for CLO-3 is 'Understand'. Replace with action-oriented operational verb like 'Synthesize' or 'Compute' to satisfy Washington Accord benchmarks.",
        resolved: false,
      },
    ] as ServerSectionComment[],
    specsRegistry: [
      {
        id: 'spec-cs304',
        code: 'CS304',
        title: 'Advanced Algorithms & Complexity',
        department: 'Dept of Computer Science & Engineering',
        author: 'Dr. Sarah Lin',
        credits: '3:0:2 (4 Credits)',
        unitsCount: 5,
        outcomesCount: 6,
        status: 'draft',
        lastUpdated: new Date().toISOString(),
        notes: 'In Authoring • Ready for departmental submission.',
      },
      {
        id: 'spec-cs201',
        code: 'CS201',
        title: 'Data Structures & Paradigms',
        department: 'Dept of Computer Science & Engineering',
        author: 'Dr. S. Mehta',
        credits: '3:1:0 (4 Credits)',
        unitsCount: 5,
        outcomesCount: 5,
        status: 'approved',
        lastUpdated: '2025-08-10 15:20',
        notes: 'Final Seal by HOD • Archival Locked',
      },
      {
        id: 'spec-cs310',
        code: 'CS310',
        title: 'Distributed Systems',
        department: 'Dept of Computer Science & Engineering',
        author: 'Dr. A. Varma',
        credits: '3:0:0 (3 Credits)',
        unitsCount: 4,
        outcomesCount: 4,
        status: 'returned',
        lastUpdated: '2025-08-19 16:30',
        notes: 'Returned with 2 unresolved remarks pending author revision.',
      },
      {
        id: 'spec-cs405',
        code: 'CS405',
        title: 'Deep Learning Architectures',
        department: 'Dept of Computer Science & Engineering',
        author: 'Dr. Sarah Lin',
        credits: '3:0:2 (4 Credits)',
        unitsCount: 5,
        outcomesCount: 5,
        status: 'draft',
        lastUpdated: '2025-08-22 11:10',
        notes: 'In Authoring • 70% complete',
      },
    ],
  };

  /**
   * RBAC Enforcement Middleware:
   * "Only the Author can edit content, and only in Draft or Returned. Enforce this on the server for every route and return HTTP 403 otherwise."
   */
  function enforceAuthorEditOnly(req: express.Request, res: express.Response, next: express.NextFunction) {
    const role = (req.headers['x-user-role'] as string) || req.body?.role || req.body?.currentRole || (req.query?.role as string);
    const currentStatus = serverWorkflowState.status;

    if (role !== 'author') {
      return res.status(403).json({
        success: false,
        error: `HTTP 403 Forbidden: Content editing restricted to Course Author only. Current role '${role || 'unspecified'}' is unauthorized to edit course specification content.`,
      });
    }

    if (currentStatus !== 'draft' && currentStatus !== 'returned') {
      return res.status(403).json({
        success: false,
        error: `HTTP 403 Forbidden: Content editing is locked while specification is in '${currentStatus}' status. Revisions are only permitted in 'Draft' or 'Returned' states.`,
      });
    }

    next();
  }

  // GET Workflow Status & Logs
  app.get('/api/v1/workflow/status', (_req, res) => {
    return res.status(200).json({
      success: true,
      data: serverWorkflowState,
    });
  });

  // POST Workflow State Transition
  app.post('/api/v1/workflow/transition', (req, res) => {
    try {
      const { targetStage, role, actorName, comment } = req.body;
      const current = serverWorkflowState.status;

      // Validate transitions per official rules
      let isValidTransition = false;
      let actionLabel = '';

      if (targetStage === 'submitted') {
        // Author submits from Draft or Returned
        if (role === 'author' && (current === 'draft' || current === 'returned')) {
          isValidTransition = true;
          actionLabel = current === 'returned' ? 'Re-submitted specification with revisions' : 'Submitted specification for peer review';
        }
      } else if (targetStage === 'under_review') {
        // Reviewer opens it
        if (role === 'reviewer' && current === 'submitted') {
          isValidTransition = true;
          actionLabel = 'Reviewer opened specification (Under Review)';
        }
      } else if (targetStage === 'pending_hod') {
        // Reviewer forwards to HOD
        if (role === 'reviewer' && (current === 'under_review' || current === 'submitted')) {
          isValidTransition = true;
          actionLabel = 'Forwarded to HOD for Board of Studies approval';
        }
      } else if (targetStage === 'approved') {
        // HOD approves
        if ((role === 'hod' || role === 'dean') && current === 'pending_hod') {
          isValidTransition = true;
          actionLabel = 'Approved & Formally Sealed by Board of Studies';
        }
      } else if (targetStage === 'returned') {
        // Reviewer or HOD returns with required comment
        if ((role === 'reviewer' && current === 'under_review') || ((role === 'hod' || role === 'dean') && current === 'pending_hod')) {
          if (!comment || !comment.trim()) {
            return res.status(400).json({
              success: false,
              error: 'Comment required: Reviewer and HOD must provide feedback comments when returning a specification.',
            });
          }
          isValidTransition = true;
          actionLabel = role === 'reviewer' ? 'Returned to Author with Reviewer feedback' : 'Returned by HOD for Departmental Corrections';
        }
      }

      if (!isValidTransition) {
        return res.status(403).json({
          success: false,
          error: `HTTP 403 Forbidden: Invalid state transition from '${current}' to '${targetStage}' by role '${role}'.`,
        });
      }

      // Execute transition
      serverWorkflowState.status = targetStage;

      const newLog: ServerAuditLog = {
        id: `log-${Date.now()}`,
        stage: targetStage,
        timestamp: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
        actor: actorName || (role === 'author' ? 'Dr. Sarah Lin' : role === 'reviewer' ? 'Prof. David Marcus' : 'Dr. Elena Rostova'),
        role: role,
        action: actionLabel,
        note: comment?.trim() || `Workflow state updated to ${targetStage}.`,
      };

      serverWorkflowState.auditLog.unshift(newLog);

      // Also update CS304 in specs registry
      const cs304 = serverWorkflowState.specsRegistry.find((s) => s.code === 'CS304');
      if (cs304) {
        cs304.status = targetStage;
        cs304.lastUpdated = new Date().toISOString();
        cs304.notes = newLog.note;
      }

      return res.status(200).json({
        success: true,
        data: {
          status: serverWorkflowState.status,
          auditLog: serverWorkflowState.auditLog,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Transition failed.' });
    }
  });

  // POST Add Section Comment (Reviewer & HOD)
  app.post('/api/v1/workflow/comment', (req, res) => {
    try {
      const { sectionNumber, sectionTitle, authorName, authorRole, comment } = req.body;

      if (!comment || !comment.trim()) {
        return res.status(400).json({ success: false, error: 'Comment text cannot be empty.' });
      }

      const newComment: ServerSectionComment = {
        id: `comment-${Date.now()}`,
        sectionNumber: Number(sectionNumber) || 1,
        sectionTitle: sectionTitle || `Section ${sectionNumber}`,
        authorName: authorName || (authorRole === 'reviewer' ? 'Prof. David Marcus' : 'Dr. Elena Rostova'),
        authorRole: authorRole || 'reviewer',
        timestamp: 'Just now',
        comment: comment.trim(),
        resolved: false,
      };

      serverWorkflowState.sectionComments.unshift(newComment);

      return res.status(200).json({
        success: true,
        data: serverWorkflowState.sectionComments,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Failed to post comment.' });
    }
  });

  // POST Content Edit Endpoint with Strict Server-Side 403 Enforcement
  app.post('/api/v1/spec/update', enforceAuthorEditOnly, (req, res) => {
    return res.status(200).json({
      success: true,
      message: 'Specification content successfully updated.',
      data: req.body,
    });
  });

  if (isDev) {
    // Mount Vite middlewares in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SpecForge server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
