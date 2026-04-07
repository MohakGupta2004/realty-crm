import { Router } from "express";
import requireAuth from "../../shared/middleware/requireAuth";
import requirePro from "../../shared/middleware/requirePro";
import * as taskController from "./task.controller";

import { validate } from "../../shared/middleware/validate";
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdParamSchema,
  workspaceIdParamSchema,
  leadAndWorkspaceIdParamSchema
} from "./task.schema";

const router = Router();

router.use(requireAuth);

router.post("/create", validate({ body: createTaskSchema }), taskController.createTask);
router.get("/workspace/:workspaceId", validate({ params: workspaceIdParamSchema }), taskController.getTasks);
router.get("/lead/:leadId/workspace/:workspaceId", validate({ params: leadAndWorkspaceIdParamSchema }), taskController.getTasksByLead);
router.put("/details/:id", validate({ params: taskIdParamSchema, body: updateTaskSchema }), taskController.updateTask);
router.delete("/details/:id", validate({ params: taskIdParamSchema }), taskController.deleteTask);

export default router;
