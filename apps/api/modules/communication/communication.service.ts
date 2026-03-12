import { Communication } from "./communication.model";
import type { ICommunicationCreate } from "./communication.types";

export class CommunicationService {
    static async createCommunication(data: ICommunicationCreate) {
        const communication = new Communication(data);
        return await communication.save();
    }

    static async getCommunicationsByLead(leadId: string) {
        return await Communication.find({ leadId }).sort({ sentAt: -1 }).populate("realtorId", "name email");
    }
}
