import { Router } from "express";
import requireAuth from "../../shared/middleware/requireAuth";
import requirePro from "../../shared/middleware/requirePro";
import { createWorkspace, getWorkspace, updateWorkspace } from "./workspace.controller";

import { validate } from "../../shared/middleware/validate";
import { createWorkspaceSchema, updateWorkspaceSchema, workspaceIdParamSchema } from "./workspace.schema";

const router = Router();

router.use(requireAuth);
router.use(requirePro);

router.post("/create", validate({ body: createWorkspaceSchema }), createWorkspace);
router.get("/", getWorkspace);
router.put("/:id", validate({ params: workspaceIdParamSchema, body: updateWorkspaceSchema }), updateWorkspace);

export default router;