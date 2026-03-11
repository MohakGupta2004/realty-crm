import { CampaignBatch } from "../campaign/models/campaignBatch.model";
import { Campaing } from "../campaign/models/campaign.model";
import { MailService } from "../mail/mail.service";

export class SchedulerService {

  static async run(): Promise<void> {

    const windowEnd = new Date(Date.now() + 5 * 60 * 1000);

    while (true) {

      const batch = await CampaignBatch.findOneAndUpdate(
        {
          status: "pending",
          runAt: { $lte: windowEnd }
        },
        {
          $set: { status: "queued" }
        },
        {
          sort: { runAt: 1 },
          new: true
        }
      );

      if (!batch) break;

      // Safety check: ensure the campaign is still running
      const campaign = await Campaing.findById(batch.campaignId).select("status").lean();
      if (!campaign || campaign.status !== "running") {
        // If not running, mark this batch as paused so we don't pick it up again immediately
        await CampaignBatch.findByIdAndUpdate(batch._id, { status: "paused" });
        continue;
      }

      await MailService.queueMail(batch._id);

    }

  }

}