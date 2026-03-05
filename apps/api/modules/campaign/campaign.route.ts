import express from "express";
import {
  createCampaing,
  updateCampaing,
  getCampaingDetails,
  getCampaings,
  deleteCampaing,
  createCampaignStep,
  startCampaign,
  deleteCampaignStep,
  getCampaignSteps,
  updateCampaignStep
} from "./campaign.controller";
import requireAuth from "../../shared/middleware/requireAuth";

const router = express.Router();

router.get("/health", (req, res) => {
  res.send("Campaing Route running properly");
});

router.use(requireAuth);

router.post("/create", createCampaing);
router.put("/update", updateCampaing);
router.get("/details/:campaignId", getCampaingDetails);
router.get("/:workspaceId", getCampaings);
router.delete("/:campaignId", deleteCampaing);

router.post('/step/create', createCampaignStep);
router.post('/start', startCampaign);
router.delete('/step/:stepId', deleteCampaignStep);
router.get('/:campaignId/steps', getCampaignSteps);
router.put('/step/:stepId', updateCampaignStep);

export default router;
