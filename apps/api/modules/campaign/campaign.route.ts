import express from "express";
import {
  createCampaing,
  updateCampaing,
  getCampaingDetails,
  getCampaings,
  deleteCampaing,
  createCampaignStep,
  startCampaign,
  stopCampaign,
  deleteCampaignStep,
  getCampaignSteps,
  getCampaignStep,
  updateCampaignStep,
  getCampaignProgress,
  trackEmailOpen,
  unsubscribeEmail,
  getTemplates,
  createTemplate,
  deleteTemplate,
  enrollLeadsByTag
} from "./campaign.controller";
import requireAuth from "../../shared/middleware/requireAuth";
import requirePro from "../../shared/middleware/requirePro";

import { validate } from "../../shared/middleware/validate";
import {
  createCampaignSchema,
  updateCampaignSchema,
  createCampaignStepSchema,
  startCampaignSchema,
  updateCampaignStepSchema,
  campaignIdParamSchema,
  workspaceIdParamSchema,
  stepIdParamSchema,
  campaignAndStepParamSchema,
  trackParamSchema,
  unsubscribeParamSchema,
  createTemplateSchema,
  templateIdParamSchema
} from "./campaign.schema";

const router = express.Router();

router.get("/health", (req, res) => {
  res.send("Campaing Route running properly");
});

router.get("/track/:batchId/:leadId", validate({ params: trackParamSchema }), trackEmailOpen);
router.get("/unsubscribe/:leadId", validate({ params: unsubscribeParamSchema }), unsubscribeEmail);

router.use(requireAuth);
router.use(requirePro);

router.post("/create", validate({ body: createCampaignSchema }), createCampaing);
router.put("/update", validate({ body: updateCampaignSchema }), updateCampaing);
router.post('/step/create', validate({ body: createCampaignStepSchema }), createCampaignStep);
router.post('/start', validate({ body: startCampaignSchema }), startCampaign);
router.post('/enroll-tag', enrollLeadsByTag);
router.post('/stop', validate({ body: campaignIdParamSchema }), stopCampaign);
router.put('/step/:stepId', validate({ params: stepIdParamSchema, body: updateCampaignStepSchema }), updateCampaignStep);
router.delete('/step/:stepId', validate({ params: stepIdParamSchema }), deleteCampaignStep);

router.get("/details/:campaignId", validate({ params: campaignIdParamSchema }), getCampaingDetails);
router.get("/progress/:campaignId", validate({ params: campaignIdParamSchema }), getCampaignProgress);
router.get('/:campaignId/steps', validate({ params: campaignIdParamSchema }), getCampaignSteps);
router.get('/:campaignId/steps/:stepId', validate({ params: campaignAndStepParamSchema }), getCampaignStep);
router.get("/:workspaceId", validate({ params: workspaceIdParamSchema }), getCampaings);
router.delete("/:campaignId", validate({ params: campaignIdParamSchema }), deleteCampaing);

router.get("/template/all", getTemplates);
router.post("/template", validate({ body: createTemplateSchema }), createTemplate);
router.delete("/template/:templateId", validate({ params: templateIdParamSchema }), deleteTemplate);

export default router;
