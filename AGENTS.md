# SpecForge - Architecture & Agent Working Rules

## Architecture Summary
1. **Frontend (`src/`)**: A modular React + Vite Single Page Application featuring interactive screens for syllabus intake, template hydration, Bloom's taxonomy CO-PO-PSO matrix alignment, deterministic audit, role-based approval governance, and print/HTML export.
2. **Backend Gateway (`server.ts` & `server/`)**: Express API server mounted on port 3000 running Vite middlewares in development, hosting `/api/v1/health` and the stateless AI proxy `/api/v1/llm-check`.
3. **Transient Key Security Pipeline**: API keys and selected LLM providers/models (`x-llm-provider`, `x-llm-key`, `x-llm-model`) are stored only in the browser's memory/localStorage and transmitted on each request header—never stored on the server, in database records, or in source `.env` files.
4. **Deterministic Validation Engine**: Real-time auditing of course outcomes, bloom levels, module hours, evaluation weights, and matrix coverage before allowing workflow transitions.
5. **Output Governance & Accreditation Artifacts**: Produces fully validated, accreditation-ready course specification documents and structured JSON schemas ready for university board approval.

## AI Provider Rules
- The application never stores secret API keys in source code, commit history, or `.env` files.
- The Settings modal in `src/Settings.tsx` collects provider credentials on the client.
- `src/api.ts` attaches `x-llm-provider`, `x-llm-key`, and `x-llm-model` to requests.
- The backend at `server/llm.ts` extracts these headers statelessly to execute requests and immediately discards them.
