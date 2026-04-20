import { Router } from "express";
import requireAuth from "../../shared/middleware/requireAuth";
import requirePro from "../../shared/middleware/requirePro";
import * as noteController from "./note.controller";
import { validate } from "../../shared/middleware/validate";
import {
  createNoteSchema,
  updateNoteSchema,
  noteIdParamSchema,
  workspaceIdParamSchema,
  leadIdParamSchema,
} from "./note.schema";

const router = Router();

router.use(requireAuth);
router.use(requirePro);

router.post("/create", validate({ body: createNoteSchema }), noteController.createNote);
router.get("/workspace/:workspaceId", validate({ params: workspaceIdParamSchema }), noteController.getNotes);
router.get("/lead/:leadId/workspace/:workspaceId", validate({ params: leadIdParamSchema }), noteController.getNotesByLead);
router.put("/details/:id", validate({ params: noteIdParamSchema, body: updateNoteSchema }), noteController.updateNote);
router.delete("/details/:id", validate({ params: noteIdParamSchema }), noteController.deleteNote);

export default router;
