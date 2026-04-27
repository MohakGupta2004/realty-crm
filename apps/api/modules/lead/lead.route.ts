import express from "express";
import { createLead, getLeads, updateLead, deleteLead, getLeadDetails, addLeads, getLeadsByCampaing, assignCampaingToLeads, getLeadEmails, getAllEmails, reassignLeadOwner } from "./lead.controller";
import { validate } from "../../shared/middleware/validate";
import {
    createLeadSchema,
    updateLeadSchema,
    addLeadsSchema,
    assignCampaignSchema,
    leadIdParamSchema,
    workspaceIdParamSchema,
    campaignAndWorkspaceParamSchema,
    reassignOwnerSchema
} from "./lead.schema";

const router = express.Router();
import requireAuth from "../../shared/middleware/requireAuth";
import requirePro from "../../shared/middleware/requirePro";


router.get("/health", (req, res) => {
    res.send("Lead Route running properly");
});

router.use(requireAuth);
router.use(requirePro);

router.post("/create", validate({ body: createLeadSchema }), createLead);
router.post("/addLeads", validate({ body: addLeadsSchema }), addLeads);
router.get("/workspace/:workspaceId", validate({ params: workspaceIdParamSchema }), getLeads);
router.get("/details/:id", validate({ params: leadIdParamSchema }), getLeadDetails);
router.get("/details/:id/emails", validate({ params: leadIdParamSchema }), getLeadEmails);
router.get("/emails", getAllEmails);
router.put("/details/:id", validate({ params: leadIdParamSchema, body: updateLeadSchema }), updateLead);
router.put("/details/:id/owner", validate({ params: leadIdParamSchema, body: reassignOwnerSchema }), reassignLeadOwner);
router.delete("/details/:id", validate({ params: leadIdParamSchema }), deleteLead);
router.get("/campaign/:campaignId/workspace/:workspaceId", validate({ params: campaignAndWorkspaceParamSchema }), getLeadsByCampaing);
router.post("/assignCampaingToLeads", validate({ body: assignCampaignSchema }), assignCampaingToLeads);


export default router;
