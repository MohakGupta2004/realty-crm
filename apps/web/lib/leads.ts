import { api } from "./api";

export interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: "new" | "contacted" | "converted" | "lost";
  workspaceId: string;
  realtorId: string;
  pipelineId: string;
  stageId?: string;
  campaignId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadInput {
  name: string;
  email: string;
  phone: string;
  source: string;
  workspaceId: string;
  pipelineId?: string;
  stageId?: string;
  type?: "BUYER" | "SELLER";
}

export interface UpdateLeadInput {
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
  pipelineId?: string;
  stageId?: string;
  status?: "new" | "contacted" | "converted" | "lost";
}

export const leadsApi = {
  getLeads: async (workspaceId: string) => {
    const response = await api.get<{ leads: Lead[] }>(
      `/lead/workspace/${workspaceId}`,
    );
    return response.leads;
  },

  getLead: async (id: string) => {
    const response = await api.get<{ lead: Lead }>(`/lead/details/${id}`);
    return response.lead;
  },

  createLead: async (data: CreateLeadInput) => {
    const response = await api.post<{ lead: Lead }>("/lead/create", data);
    return response.lead;
  },

  updateLead: async (id: string, data: UpdateLeadInput) => {
    const response = await api.put<{ lead: Lead }>(`/lead/details/${id}`, data);
    return response.lead;
  },

  deleteLead: async (id: string) => {
    const response = await api.delete<{ lead: Lead }>(`/lead/details/${id}`);
    return response.lead;
  },

  addBulkLeads: async (
    leads: Omit<CreateLeadInput, "workspaceId">[],
    workspaceId: string,
    pipelineId?: string,
  ) => {
    const response = await api.post<{ leads: Lead[] }>("/lead/addLeads", {
      leads,
      workspaceId,
      pipelineId,
    });
    return response.leads;
  },
};
