import type { Request, Response } from "express";
import { trackerService } from "./tracker.service";

export const trackBatch = async (req: Request, res: Response) => {
  try {
    const { apiKey, visitorId, events } = req.body;

    if (typeof apiKey !== "string" || apiKey.length > 100) {
      return res.status(400).send("Invalid apiKey");
    }

    if (typeof visitorId !== "string" || visitorId.length > 100) {
      return res.status(400).send("Invalid visitorId");
    }

    if (!Array.isArray(events) || events.length === 0 || events.length > 50) {
      return res.status(400).send("Invalid events payload");
    }

    const origin = req.headers.origin || req.headers.referer || "";

    await trackerService.processBatchEvents(apiKey, visitorId, events, origin);
    
    return res.sendStatus(200);
  } catch (err: any) {
    if (err.message === "INVALID_API_KEY") {
        return res.status(403).send("Invalid API key");
    }
    if (err.message === "INVALID_DOMAIN") {
        return res.status(403).send("Invalid domain");
    }
    console.error("Track batch error:", err);
    return res.sendStatus(500);
  }
};

export const identifyVisitor = async (req: Request, res: Response) => {
  try {
    const { apiKey, visitorId, email, name } = req.body;

    if (!email) {
      return res.status(400).send("Email required");
    }

    if (typeof apiKey !== "string" || apiKey.length > 100) {
      return res.status(400).send("Invalid apiKey");
    }

    if (typeof visitorId !== "string" || visitorId.length > 100) {
      return res.status(400).send("Invalid visitorId");
    }

    const origin = req.headers.origin || req.headers.referer || "";

    const lead = await trackerService.identifyVisitor(apiKey, visitorId, email, name, origin);
    
    return res.json({ success: true, lead });
  } catch (err: any) {
    if (err.message === "INVALID_API_KEY") {
        return res.status(403).send("Invalid API key");
    }
    if (err.message === "INVALID_DOMAIN") {
        return res.status(403).send("Invalid domain");
    }
    console.error("Identify error:", err);
    return res.sendStatus(500);
  }
};

export const getWorkspaceEvents = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const data = await trackerService.getEvents(workspaceId, page, limit);
    return res.json({ success: true, ...data });
  } catch (err: any) {
    console.error("Get workspace events error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getWorkspaceVisitors = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const data = await trackerService.getVisitors(workspaceId, page, limit);
    return res.json({ success: true, ...data });
  } catch (err: any) {
    console.error("Get workspace visitors error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
