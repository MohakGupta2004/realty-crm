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

## 🔄 Full Operational Flow

### 1. Onboarding (Setup)
*   Realtor purchases a number via `POST /onboard`.
*   Realtor toggles the global switch to `ON` via `PUT /status/toggle`.
*   **Safety Guard:** The switch cannot be turned ON unless a phone number has been successfully acquired.

### 2. Enrollment (The "Start" Logic)
*   **Automatic:** When a lead is created (manually, via CSV upload, or via Website Tracker), the system automatically enrolls them in the Realtor's **Default Campaign**.
*   **Manual:** A Realtor can override the default and assign a specific campaign to a lead via `POST /assign`.
*   **Initial State:** Leads are parked in the DB with status `AWAITING_CRON` and a `nextSmsTime` calculated from the first step's delay.

### 3. Execution (The Engine)
*   **Cron Sweep:** Every 10 minutes, the Master Queue scans for leads due within 2 hours.
*   **Task Fan-out:** Due leads are moved to the SMS Dispatch Queue (GCP Tasks).
*   **Worker Check:** Right before sending, the worker performs "Pre-flight Checks" (Is the Master Switch still ON? Is the Campaign still Active? Has the Lead replied already?).
*   **Dispatch:** If checks pass, the SMS is sent via Twilio.

### 4. Engagement & Takeover
*   **Auto-Pause:** If a lead replies with *any* text, the system automatically flips that lead to `PAUSED`. Automation stops so the Realtor can take over the chat manually.
*   **Opt-Out:** If a lead sends "STOP", they are marked as `STOPPED` and globally unsubscribed for legal compliance.

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
| `/campaign/:campaignId` | `PUT` | Updates metadata or **Switches Default** | `{ "isDefault": true }` |
| `/campaign/:campaignId` | `DELETE` | Deletes a campaign | `N/A` |
| `/campaign/:campaignId/pause` | `POST` | Pauses the entire campaign | `N/A` |
| `/campaign/:campaignId/resume` | `POST` | Resumes the entire campaign | `N/A` |

> [!IMPORTANT]
> **Switching the Default Campaign:**
> To change which campaign is automatically assigned to new leads, send `PUT /campaign/:id` with `{ "isDefault": true }`.
> The backend will automatically handle the "swap"—unsetting the previous default and setting the new one. This only affects **new leads**; existing leads remain in their original campaigns.

> [!NOTE]
> **Campaign Pause/Resume Flow:**
> When the user clicks "Pause Campaign", call `POST /campaign/:id/pause`. 
> - **Backend:** Sets `isActive: false` and moves active leads to `PAUSED_BY_CAMPAIGN`.
> - **Behavioral Pause (`PAUSED`)**: Remains separate. Resuming the campaign will **not** accidentally resume leads who replied to you!

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


