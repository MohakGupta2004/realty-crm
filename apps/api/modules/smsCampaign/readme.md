# SMS Drip Campaign Architecture

This module implements a high-performance, precision-timed SMS drip campaign system using a **Two-Queue Fan-Out Architecture**.

## 🏗️ Architecture Overview

The system is designed as a **"General and Soldiers"** model to balance database performance with execution precision.

1.  **MongoDB (Long-term Storage):** Acts as the "parking lot" for leads. Messages scheduled days or weeks in the future stay here with status `AWAITING_CRON`.
2.  **Master Queue (The "General"):**
    *   Fired every 10 minutes via **Cloud Scheduler**.
    *   Scans the DB for any leads whose next SMS is due within the next **2 hours**.
    *   "Fans out" the work by creating individual tasks in the SMS Dispatch Queue.
3.  **SMS Dispatch Queue (The "Soldiers"):**
    *   Holds individual tasks, one per lead.
    *   Uses GCP's `scheduleTime` to wait until the **exact second** a message is due.
    *   Calls the `/worker/send` endpoint to trigger the actual Twilio dispatch.

---

## 🚀 Production Setup

### 1. Create GCP Task Queues
Run these commands to create the two required queues:

```bash
# 1. Master Dispatch Queue (Strictly 1 concurrent to prevent DB race conditions)
gcloud tasks queues create sms-master-queue \
    --location=YOUR_GCP_REGION \
    --max-dispatches-per-second=1 \
    --max-concurrent-dispatches=1

# 2. SMS Send Queue (Higher concurrency for parallel sending)
gcloud tasks queues create sms-dispatch-queue \
    --location=YOUR_GCP_REGION \
    --max-dispatches-per-second=10 \
    --max-concurrent-dispatches=20
```

### 2. Create Cloud Scheduler Job
This job acts as the "heartbeat" that wakes up the Master Queue every 10 minutes.

```bash
gcloud scheduler jobs create http sms-cron-trigger \
    --location=YOUR_GCP_REGION \
    --schedule="*/10 * * * *" \
    --time-zone="UTC" \
    --uri="https://your-api-url.com/api/v1/sms/scheduler" \
    --http-method=POST \
    --headers="Content-Type=application/json,x-internal-secret=YOUR_INTERNAL_SECRET"
```

### 3. Required Environment Variables
Ensure these are set in your **Cloud Run** configuration:

- `GCP_PROJECT_ID`: Your Google Cloud Project ID.
- `GCP_REGION`: The region where queues were created.
- `GCP_MASTER_QUEUE_NAME`: `sms-master-queue`
- `GCP_SMS_QUEUE_NAME`: `sms-dispatch-queue`
- `INTERNAL_SECRET`: Must match the secret used in the Cloud Scheduler headers.
- `BACKEND_URL`: The public URL of your Cloud Run service.

---

## 🌐 API Documentation (for Frontend)

All routes require authentication and are prefixed with `/api/v1/sms`.

### 1. Onboarding & Settings
| Endpoint | Method | Description | Request Body Example |
| :--- | :--- | :--- | :--- |
| `/onboard` | `POST` | Purchases a Twilio subaccount number | `{ "country": "US", "areaCode": "512" }` |
| `/status` | `GET` | Returns campaign status and onboarding state | `N/A` |
| `/status/toggle` | `PUT` | Toggles the global SMS switch | `{ "hasSMSCampaignEnabled": true }` |

> [!TIP]
> **Frontend Implementation Note:**
> Use `GET /status` to initialize your UI:
> - **Switch State:** Determined by `data.hasSMSCampaignEnabled`.
> - **Disabled State:** If `data.isOnboarded` is `false`, the switch should be **disabled** (unclickable).
> 
> **Handling the Toggle:**
> - **Turning ON:** Send `{ "hasSMSCampaignEnabled": true }`.
> - **Turning OFF:** Send `{ "hasSMSCampaignEnabled": false }`.



### 2. Campaign Enrollment
| Endpoint | Method | Description | Request Body Example |
| :--- | :--- | :--- | :--- |
| `/assign` | `POST` | Enrolls a single lead | `{ "leadId": "...", "campaignId": "..." }` |
| `/assign-bulk` | `POST` | Enrolls multiple leads | `{ "leadIds": ["ID1", "ID2"], "campaignId": "..." }` |

### 3. Campaign Management (CRUD)
| Endpoint | Method | Description | Request Body Example |
| :--- | :--- | :--- | :--- |
| `/campaign` | `POST` | Creates a new campaign | `{ "name": "Drip 1", "steps": [...], "isDefault": true }` |
| `/campaign` | `GET` | Lists all user campaigns | `N/A` |
| `/campaign/:campaignId` | `GET` | Fetches a single campaign | `N/A` |
| `/campaign/:campaignId` | `PUT` | Updates campaign metadata | `{ "name": "New Name", "isActive": true }` |
| `/campaign/:campaignId` | `DELETE` | Deletes a campaign | `N/A` |

### 4. Step Management
| Endpoint | Method | Description | Request Body Example |
| :--- | :--- | :--- | :--- |
| `/campaign/:campaignId/step` | `POST` | Appends a step to campaign | `{ "stepIndex": 0, "delaySeconds": 3600, "message": "Hello" }` |
| `/campaign/:campaignId/step/:stepIndex` | `PUT` | Updates an existing step | `{ "message": "Updated text", "delaySeconds": 60 }` |
| `/campaign/:campaignId/step/:stepIndex` | `DELETE` | Deletes a specific step | `N/A` |

### 5. Leads & History
| Endpoint | Method | Description | Request Body Example |
| :--- | :--- | :--- | :--- |
| `/lead/:leadId/messages` | `GET` | Fetches full SMS history for a lead | `N/A` |


