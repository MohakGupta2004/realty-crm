import { Router } from "express";
import requireAuth from "../../shared/middleware/requireAuth";
import requirePro from "../../shared/middleware/requirePro";
import { validate } from "../../shared/middleware/validate";
import { createPipeline, getPipelines, getPipelineDetails, updatePipeline, deletePipeline } from "./pipeline.controller";
import { createPipelineSchema, updatePipelineSchema, pipelineIdParamSchema, workspaceIdParamSchema } from "./pipeline.schema";

const router = Router();

router.get("/health", (req, res) => {
    res.send("Pipeline Route running properly");
});


router.use(requireAuth);
router.use(requirePro);

router.post("/create", validate({ body: createPipelineSchema }), createPipeline);
router.get("/workspace/:workspaceId", validate({ params: workspaceIdParamSchema }), getPipelines);
router.get("/details/:id", validate({ params: pipelineIdParamSchema }), getPipelineDetails);
router.put("/details/:id", validate({ params: pipelineIdParamSchema, body: updatePipelineSchema }), updatePipeline);
router.delete("/details/:id", validate({ params: pipelineIdParamSchema }), deletePipeline);

export default router;
