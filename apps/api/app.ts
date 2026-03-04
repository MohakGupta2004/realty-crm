import express from 'express'
import cookieParser from "cookie-parser";
import authModule from './modules/auth/auth.module'
import userModule from './modules/user/user.module'
import workspaceModule from './modules/workspace/workspace.module'
import membershipModule from './modules/memberships/memberships.module'
import leadModule from './modules/lead/lead.module'
import pipelineModule from './modules/pipeline/pipeline.module'
import pipelineStageModule from './modules/pipelineStage/pipelineStage.module'

const app = express();

// ── Global Middleware ─────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());

// ── Health Check ──────────────────────────────────────────────────────
app.get("/api/v1/health", (_req, res) => {
    res.status(200).json({ status: "healthy" });
});

// ── Module Routes ─────────────────────────────────────────────────────
app.use("/api/v1/auth", authModule);
app.use("/api/v1/user", userModule);
app.use("/api/v1/workspace", workspaceModule);
app.use("/api/v1/memberships", membershipModule);
app.use("/api/v1/lead", leadModule);
app.use("/api/v1/pipeline", pipelineModule);
app.use("/api/v1/pipeline-stage", pipelineStageModule);

export default app;

