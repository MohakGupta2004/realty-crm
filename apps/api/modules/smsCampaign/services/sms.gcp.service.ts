import { CloudTasksClient } from "@google-cloud/tasks";
import { env } from "../../../shared/config/env.config";

export class SMS_GCP_Service {
    private static client = new CloudTasksClient();

    static async createGCPTask(enrollmentId: string, delaySeconds: number, campaignIdAtTimeOfScheduling: string, stepIndexAtTimeOfScheduling: number) {
        try {
            const project = env.GCP_PROJECT_ID;
            const location = env.GCP_REGION;
            const queue = env.GCP_SMS_QUEUE_NAME;

            if (!project || !location || !queue) {
                throw new Error('Missing required GCP environment variables: GCP_PROJECT_ID, GCP_REGION, or GCP_SMS_QUEUE_NAME');
            }

            const workerUrl = env.BACKEND_URL + '/api/v1/sms/worker/send';

            const parent = this.client.queuePath(project, location, queue);
            const task = {
                scheduleTime: {
                    seconds: Math.floor(Date.now() / 1000) + delaySeconds,
                },
                httpRequest: {
                    httpMethod: 'POST' as const,
                    url: workerUrl,
                    body: Buffer.from(JSON.stringify({
                        enrollmentId,
                        campaignIdAtTimeOfScheduling,
                        stepIndexAtTimeOfScheduling
                    })).toString('base64'),
                    headers: {
                        'Content-Type': 'application/json',
                        'x-internal-secret': env.INTERNAL_SECRET!,
                    }
                },
            };
            const result = await this.client.createTask({ parent, task });
            const response = result[0];
            console.log(`Created task ${response.name}`);
            return response;
        } catch (error) {
            throw error;
        }
    }

    static async createSingleMasterDispatchTask() {
        const project = env.GCP_PROJECT_ID!;
        const queue = env.GCP_MASTER_QUEUE_NAME!;
        const location = env.GCP_REGION!;
        const url = env.BACKEND_URL + '/api/v1/sms/scheduler/worker';

        if (!project || !queue || !location || !url) {
            throw new Error('Missing required GCP environment variables: GCP_PROJECT_ID, GCP_REGION, GCP_QUEUE_NAME or BACKEND_URL');
        }

        const parent = this.client.queuePath(project, location, queue);

        const task = {
            httpRequest: {
                httpMethod: 'POST' as const,
                url,
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-secret': env.INTERNAL_SECRET!
                },
            },
        };

        await this.client.createTask({ parent, task });
    }
}  