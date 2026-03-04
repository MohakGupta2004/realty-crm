import { Router } from "express";
import requireAuth from "../../shared/middleware/requireAuth";
import { createPipeline, getPipelines, getPipelineDetails, updatePipeline, deletePipeline } from "./pipeline.controller";

const router = Router();

router.get("/health", (req, res) => {
    res.send("Pipeline Route running properly");
});


router.use(requireAuth);

router.post("/create", createPipeline);
router.get("/workspace/:workspaceId", getPipelines);
router.get("/details/:id", getPipelineDetails);
router.put("/details/:id", updatePipeline);
router.delete("/details/:id", deletePipeline);

export default router;
