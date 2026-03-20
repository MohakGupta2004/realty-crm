import type { Request, Response } from "express";
import express from "express";
import { Workspace } from "../workspace/workspace.model";
import { Event } from "./events.model";
import { Visitor } from "./visitors.model";
import { Lead } from "../lead/lead.model";
import rateLimit from "express-rate-limit";

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200
});

function isValidDomain(origin: string, domain: string) {
  try {
    const hostname = new URL(origin).hostname;
    return (
      hostname === domain ||
      hostname.endsWith("." + domain)
    );
  } catch {
    return false;
  }
}

router.use("/api/track-batch", limiter);
router.use("/api/identify", limiter);

router.post("/api/track-batch", async (req: Request, res: Response) => {
  try {
    const { apiKey, visitorId, events } = req.body;

    if (typeof apiKey !== "string" || apiKey.length > 100) {
      return res.status(400).send("Invalid apiKey");
    }

    if (typeof visitorId !== "string" || visitorId.length > 100) {
      return res.status(400).send("Invalid visitorId");
    }

    // 1. Validate apiKey
    const workspace = await Workspace.findOne({ apiKey }).select("_id domain");
    if (!workspace) {
      return res.status(403).send("Invalid API key");
    }

    // 2. Validate domain
    const origin = req.headers.origin || req.headers.referer || "";
    if (!isValidDomain(origin, workspace.domain)) {
      return res.status(403).send("Invalid domain");
    }

    // 3. Validate payload
    if (!Array.isArray(events) || events.length === 0 || events.length > 50) {
      return res.status(400).send("Invalid events payload");
    }

    // 4. Ensure visitor exists
    const visitor = await Visitor.findOneAndUpdate(
      { visitorId, workspaceId: workspace._id },
      { $setOnInsert: { workspaceId: workspace._id } },
      { upsert: true, new: true }
    ).select("leadId");

    // 5. Prepare events
    const allowedEvents = ["page_view", "click", "form_submit", "identify"];
    const formattedEvents = events.map((e: any) => {
      if (!allowedEvents.includes(e.event)) {
        console.warn("Invalid event:", e.event);
        return null;
      }

      return {
        workspaceId: workspace._id,
        visitorId: visitorId,
        leadId: visitor.leadId || null, // important
        event: e.event,
        data: typeof e.data === "object" ? e.data : {},
        timestamp: e.timestamp || Date.now(),
      };
    }).filter(Boolean);

    // 6. Store events
    if (formattedEvents.length > 0) {
      await Event.insertMany(formattedEvents, { ordered: false });
      if (process.env.NODE_ENV !== "production") {
        console.log("Track:", {
          workspace: workspace._id,
          visitorId,
          eventsCount: formattedEvents.length
        });
      }
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("Track batch error:", err);
    return res.sendStatus(500);
  }
});


router.post("/api/identify", async (req: Request, res: Response) => {
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

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Validate apiKey
    const workspace = await Workspace.findOne({ apiKey }).select("_id domain");
    if (!workspace) {
      return res.status(403).send("Invalid API key");
    }

    // 1.5 Validate domain
    const origin = req.headers.origin || req.headers.referer || "";
    if (!isValidDomain(origin, workspace.domain)) {
      return res.status(403).send("Invalid domain");
    }

    // 2. Find or create lead
    const lead = await Lead.findOneAndUpdate(
      { email: normalizedEmail, workspaceId: workspace._id },
      {
        $set: { name: typeof name === "string" ? name.slice(0, 100) : undefined },
        $setOnInsert: { workspaceId: workspace._id }
      },
      { upsert: true, new: true }
    );

    // 3. Link visitor → lead
    const oldVisitor = await Visitor.findOne({ visitorId, workspaceId: workspace._id });
    const visitor = await Visitor.findOneAndUpdate(
      { visitorId, workspaceId: workspace._id },
      { leadId: lead._id, workspaceId: workspace._id },
      { upsert: true, new: true }
    );

    // 4. Update ALL past events
    if (!oldVisitor || oldVisitor.leadId?.toString() !== lead._id.toString()) {
      await Event.updateMany(
        { visitorId, workspaceId: workspace._id },
        { leadId: lead._id }
      );
    }

    return res.json({ success: true, lead });
  } catch (err) {
    console.error("Identify error:", err);
    return res.sendStatus(500);
  }
});

export default router;