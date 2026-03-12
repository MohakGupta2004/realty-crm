import { Activity } from "./activity.model";
import { ActivityType, type IActivityCreate } from "./activity.types";

export class ActivityService {
    static async logActivity(data: IActivityCreate) {
        try {
            const activity = new Activity(data);
            return await activity.save();
        } catch (error) {
            console.error("Failed to log activity:", error);
            // Don't throw, we don't want to break the main flow if logging fails
            return null;
        }
    }

    static async getActivitiesByLead(leadId: string) {
        return await Activity.find({ leadId })
            .sort({ createdAt: -1 })
            .populate("realtorId", "name email")
            .lean();
    }
}
