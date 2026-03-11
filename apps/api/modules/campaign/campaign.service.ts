import { Campaing } from "./models/campaign.model";
import { CampaignStep } from "./models/campaignStep.model";
import { CampaignBatch } from "./models/campaignBatch.model";
import type { ICampaignCreate, ICampaignUpdate, ICampaignStepCreate, ILead } from "./campaign.types";

export class CampaingService {
  static async createCampaing(data: ICampaignCreate) {
    const campaing = await Campaing.create({
      name: data.name,
      description: data.description,
      status: data.status,
      workspaceId: data.workspaceId,
      userId: data.userId,
    });
    return campaing;
  }

  static async updateCampaing(updateData: ICampaignUpdate, userId: string) {
    const campaing = await Campaing.findOneAndUpdate(
      { _id: updateData.campaignId, userId },
      {
        name: updateData.name,
        description: updateData.description,
        status: updateData.status,
      },
      { new: true },
    ).lean();
    return campaing;
  }

  static async deleteCampaing(campaingId: string, userId: string) {
    const campaing = await Campaing.findOneAndDelete({
      _id: campaingId,
      userId,
    }).lean();
    return campaing;
  }

  static async getCampaing(campaingId: string, userId: string) {
    const campaing = await Campaing.findOne({ _id: campaingId, userId }).lean();
    return campaing;
  }

  static async getCampaings(workspaceId: string, userId: string) {
    const campaings = await Campaing.find({ workspaceId, userId })
      .sort({ createdAt: -1 })
      .lean();
    const datas = campaings.map(c => {
      return {
        name: c.name,
        description: c.description,
        status: c.status,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        _id: c._id,
      }
    });
    return datas;
  }

  static async createCampaignStep(data: ICampaignStepCreate) {
    const campaignStep = await CampaignStep.create({
      campaignId: data.campaignId,
      subject: data.subject,
      body: data.body,
      delayDays: data.delayDays,
      stepOrder: data.stepOrder,
    });
    await campaignStep.save();
    return campaignStep;
  }


  static async startCampaign(campaignId: string, leads: ILead[]) {

    const steps = await CampaignStep
      .find({ campaignId })
      .sort({ stepOrder: 1 })
      .lean();

    const campaign = await Campaing.findById(campaignId);

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // 1. Flip any paused batches to pending (resume scenario)
    await CampaignBatch.updateMany(
      { campaignId, status: "paused" },
      { $set: { status: "pending" } }
    );

    const BATCH_SIZE = 50;

    for (const step of steps) {
      // 2. Check if this step already has batches
      const stepBatchesCount = await CampaignBatch.countDocuments({ 
        campaignId, 
        stepId: step._id 
      });

      if (stepBatchesCount === 0) {
        // 3. Create batches ONLY if they don't exist for this step
        const runAt = new Date(
          Date.now() + step.delayDays * 86400000
        );

        const newBatches = [];
        for (let i = 0; i < leads.length; i += BATCH_SIZE) {
          newBatches.push({
            campaignId,
            stepId: step._id,
            leads: leads.slice(i, i + BATCH_SIZE),
            runAt,
            status: "pending"
          });
        }

        if (newBatches.length > 0) {
          await CampaignBatch.insertMany(newBatches);
        }
      }
    }

    await Campaing.findByIdAndUpdate(campaignId, {
      status: "running"
    });

  }

  static async stopCampaign(campaignId: string) {
    // 1. Set campaign to paused
    await Campaing.findByIdAndUpdate(campaignId, { status: "paused" });

    // 2. Set all pending batches to paused so scheduler skips them
    await CampaignBatch.updateMany(
      { campaignId, status: "pending" },
      { $set: { status: "paused" } }
    );

    return { success: true };
  }

  static async getCampaignProgress(campaignId: string) {
    const total = await CampaignBatch.countDocuments({ campaignId });
    const sent = await CampaignBatch.countDocuments({ campaignId, status: "sent" });
    const failed = await CampaignBatch.countDocuments({ campaignId, status: "failed" });

    return {
      total,
      sent,
      failed,
      percentage: total > 0 ? Math.round((sent / total) * 100) : 0
    };
  }

  static async deleteCampaignStep(stepId: string) {
    const campaignStep = await CampaignStep.findByIdAndDelete(stepId);
    return campaignStep;
  }

  static async getCampaignSteps(campaignId: string) {
    const campaignStep = await CampaignStep.find({ campaignId })
      .select("delayDays subject body stepOrder _id")
      .sort({ stepOrder: 1 })
      .lean();
    return campaignStep;
  }

  static async getCampaignStep(stepId: string) {
    const campaignStep = await CampaignStep.findById(stepId).select("subject body delayDays").lean();
    return campaignStep;
  }

  static async updateCampaignStep(stepId: string, subject: string, body: string, delayDays: number) {
    const campaignStep = await CampaignStep.findByIdAndUpdate(
      stepId,
      { subject, body, delayDays },
      { new: true },
    );
    return campaignStep;
  }
}
