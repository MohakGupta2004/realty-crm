import { Workspace } from "./workspace.model";

class WorkspaceService {
    async createWorkspace(name: string, userId: string) {
        const workspace = await Workspace.create({ name, type: "SOLO", owner: userId });
        return workspace;
    }

    async getWorkspace(userId: string) {
        const workspace = await Workspace.findOne({ owner: userId });
        return workspace;
    }
}

export const workspaceService = new WorkspaceService()