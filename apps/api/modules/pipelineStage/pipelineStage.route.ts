import { Router } from "express";
import requireAuth from "../../shared/middleware/requireAuth";
import requirePro from "../../shared/middleware/requirePro";
import {
    createPipelineStage,
    getStagesByPipeline,
    getStageDetails,
    updatePipelineStage,
    deletePipelineStage,
    getKanbanBoard,
    getStageWithLeads,
    reorderStages,
    moveLead,
} from "./pipelineStage.controller";
import { validate } from "../../shared/middleware/validate";
import {
    createPipelineStageSchema,
    updatePipelineStageSchema,
    reorderStagesSchema,
    moveLeadSchema,
    stageIdParamSchema,
    pipelineIdParamSchema
} from "./pipelineStage.schema";

const router = Router();

router.get("/health", (req, res) => {
    res.send("Pipeline Stage Route running properly");
});

router.use(requireAuth);
router.use(requirePro);

// ── Standard CRUD ─────────────────────────────────────────────────────
router.post("/create", validate({ body: createPipelineStageSchema }), createPipelineStage);
router.get("/pipeline/:pipelineId", validate({ params: pipelineIdParamSchema }), getStagesByPipeline);
router.get("/details/:id", validate({ params: stageIdParamSchema }), getStageDetails);
router.put("/details/:id", validate({ params: stageIdParamSchema, body: updatePipelineStageSchema }), updatePipelineStage);
router.delete("/details/:id", validate({ params: stageIdParamSchema }), deletePipelineStage);

// ── Kanban-Specific ───────────────────────────────────────────────────
router.get("/kanban/:pipelineId", validate({ params: pipelineIdParamSchema }), getKanbanBoard);
router.get("/details/:id/leads", validate({ params: stageIdParamSchema }), getStageWithLeads);
router.put("/reorder", validate({ body: reorderStagesSchema }), reorderStages);
router.put("/move-lead", validate({ body: moveLeadSchema }), moveLead);

export default router;
