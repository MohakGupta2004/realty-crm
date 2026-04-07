import { Router } from "express";
import requireAuth from "../../shared/middleware/requireAuth";
import requirePro from "../../shared/middleware/requirePro";
import {
    addMembers,
    getMembers,
    getMember,
    updateMember,
    removeMember,
    generateInviteLink,
    joinWorkspace,
} from "./memberships.controller";
import { validate } from "../../shared/middleware/validate";
import { addMembersSchema, updateMemberSchema, membershipIdParamSchema, workspaceIdParamSchema, tokenParamSchema } from "./memberships.schema";

const router = Router();

router.use(requireAuth);

router.post("/add", validate({ body: addMembersSchema }), addMembers);
router.get("/workspace/:workspaceId", validate({ params: workspaceIdParamSchema }), getMembers);
router.get("/invite/:workspaceId", validate({ params: workspaceIdParamSchema }), generateInviteLink);
router.post("/join/:token", validate({ params: tokenParamSchema }), joinWorkspace);
router.get("/:id", validate({ params: membershipIdParamSchema }), getMember);
router.patch("/:id", validate({ params: membershipIdParamSchema, body: updateMemberSchema }), updateMember);
router.delete("/:id", validate({ params: membershipIdParamSchema }), removeMember);

export default router;
