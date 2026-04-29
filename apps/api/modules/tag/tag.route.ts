import { Router } from "express";
import { TagController } from "./tag.controller";
import requireAuth from "../../shared/middleware/requireAuth";

const router = Router();

router.use(requireAuth);


router.post("/create", TagController.createTag);
router.get("/list", TagController.getTags);
router.patch("/:id", TagController.updateTag);
router.delete("/:id", TagController.deleteTag);

export default router;
