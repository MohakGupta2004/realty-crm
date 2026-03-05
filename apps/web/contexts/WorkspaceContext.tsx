"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { api } from "@/lib/api";

interface Workspace {
  _id: string;
  name: string;
  type: "SOLO" | "TEAM";
  createdAt: string;
  updatedAt: string;
}

interface Membership {
  _id: string;
  workspaceId: Workspace;
  role: "OWNER" | "ADMIN" | "MEMBER";
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  memberships: Membership[];
  isLoading: boolean;
  setCurrentWorkspace: (workspace: Workspace) => void;
  createWorkspace: (name: string) => Promise<Workspace>;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] =
    useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    try {
      // Try to get user's workspaces through memberships
      // Since backend requires workspaceId, we'll get the current workspace from localStorage
      // and verify it exists, or try to get all workspaces
      const storedWorkspaceId = localStorage.getItem("currentWorkspaceId");

      if (storedWorkspaceId) {
        // Try to get workspace details - for now we construct a minimal workspace object
        // In a real scenario, you might want to add a GET /workspace/me endpoint to backend
        setCurrentWorkspaceState({
          _id: storedWorkspaceId,
          name: "My Workspace",
          type: "SOLO",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaces();
    } else {
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      setMemberships([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchWorkspaces]);

  const setCurrentWorkspace = useCallback((workspace: Workspace) => {
    setCurrentWorkspaceState(workspace);
    localStorage.setItem("currentWorkspaceId", workspace._id);
  }, []);

  const createWorkspace = useCallback(
    async (name: string) => {
      const response = await api.post<Workspace>("/workspace/create", { name });
      await fetchWorkspaces();
      return response;
    },
    [fetchWorkspaces],
  );

  const refreshWorkspaces = useCallback(async () => {
    setIsLoading(true);
    await fetchWorkspaces();
  }, [fetchWorkspaces]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        memberships,
        isLoading,
        setCurrentWorkspace,
        createWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
