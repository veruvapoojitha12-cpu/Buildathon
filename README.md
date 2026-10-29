# SpecForge - Course Specification Builder

SpecForge is an academic curriculum specification workbench designed for higher education institutions. It automates syllabus parsing, Course Outcome (CO) formulation with Bloom's Taxonomy, Programme Outcome (PO) and Programme Specific Outcome (PSO) matrix mapping, automated validation audits, and multi-role approval governance.

## AI Tools Used
- **Supported AI Providers**: Anthropic Claude (`claude-3-7-sonnet`, `claude-3-5-sonnet`), OpenAI (`gpt-4o`, `gpt-4o-mini`), and Google Gemini (`gemini-2.0-flash`, `gemini-1.5-pro`).
- **Transient Security Model**: All keys flow from client `Settings` via transient request headers (`x-llm-provider`, `x-llm-key`, `x-llm-model`) into `server/llm.ts` statelessly; keys are never persisted in code, server storage, or `.env` files.

## Getting Started & Run Steps

### 1. Installation
Install project dependencies:
```bash
npm install
```

### 2. Run the Development Server
Starts the Express server with embedded Vite middleware on port 3000:
```bash
npm run dev
```
Open your browser at `http://localhost:3000` to access the application.

### 3. Verify Health Endpoint
Verify the backend is live:
```bash
curl http://localhost:3000/api/v1/health
# Expected: {"success":true,"data":{"status":"up"}}
```

### 4. Code Quality & Type Check
Verify TypeScript types:
```bash
npm run typecheck
```

Run comprehensive lint and build verification:
```bash
npm run check
npm run verify
```

## Screen Overview
- **Spec Builder**: Master course specification editor (Course metadata, Credits, Units, Evaluation).
- **Intake Parser**: Document intake for existing syllabi with automated outcome extraction.
- **Template Hydration**: Official institutional templates and preset schemas.
- **CO-PO-PSO Alignment**: Interactive correlation matrix with weighted average computation and Bloom level tagging.
- **Audit & Validation**: Deterministic defect checks (severity badges, codes, error locations, and auto-fixes).
- **Approval Governance**: Stage progression workflow with role-based permissions (Author, Reviewer, HOD) and audit timeline.
- **Specification Export**: Paper-like accreditation preview, PDF print styles, HTML export, and JSON payload export.
