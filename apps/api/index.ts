import { env } from "./shared/config/env.config";
import { connectDB } from "./shared/config/db";
import app from "./app";
import { SchedulerService } from "./modules/scheduler/scheduler.service";

async function startServer() {
    await connectDB();

    app.listen(env.PORT, () => {
        console.log(
            `Server running on port ${env.PORT} [${env.NODE_ENV}]`,
        );

        if (env.NODE_ENV === "development") {
            console.log("Development mode: Starting local scheduler (every 60s)...");
            setInterval(async () => {
                try {
                    await SchedulerService.run();
                } catch (err) {
                    console.error("Local scheduler error:", err);
                }
            }, 60000);
        }
    });
}

startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});