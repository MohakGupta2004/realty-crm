import { Workspace } from "./workspace.model";
import { Membership } from "../memberships/memberships.model";
import { trackerService } from "../trackers/tracker.service";
import { ApiKey } from "../trackers/key.model";

class WorkspaceService {
    async createWorkspace(name: string, userId: string, domain?: string) {
        const workspace = await Workspace.create({ name, type: "SOLO", owner: userId });
        await trackerService.generateApiKey(String(workspace._id), userId, domain);
        return workspace;
    }

    async updateWorkspace(workspaceId: string, data: { name?: string; domain?: string }) {
        const { domain, ...otherData } = data;
        const workspace = await Workspace.findByIdAndUpdate(workspaceId, { $set: otherData }, { new: true });
        
        if (domain !== undefined) {
            await ApiKey.updateMany({ workspace: workspaceId }, { $set: { domain } });
        }
        
        return workspace;
    }

    async getWorkspacesForUser(userId: string) {
        const memberships = await Membership.find({ user: userId, isRemoved: false })
            .populate("workspace")
            .sort({ createdAt: 1 })
            .lean();
        
        return memberships
            .filter((m) => m.workspace)
            .map((m) => ({
                ...(m.workspace as any),
                role: m.role,
                membershipId: m._id,
            }));
    }
}

export const workspaceService = new WorkspaceService();