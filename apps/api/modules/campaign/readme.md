# Campaign & Email Automation Module

This module handles multi-step email drip campaigns, lead enrollment, and automated scheduling.

---

## Key Features

### 1. Robust Enrollment Engine
The system supports adding leads to campaigns at any stage of their lifecycle. Unlike traditional "fixed-batch" systems, our engine allows you to add new leads to a campaign even if it is **already running**. The new leads will automatically be scheduled for Step 1 and progress through the drip independently.

### 2. Tag-Based Enrollment (Smart Automation)
You can enroll leads into a campaign based on their Tags. This works seamlessly with both:
*   **Manual Tags**: Enroll a static group of leads.
*   **Dynamic Tags (Smart Views)**: Enroll all leads currently matching a specific filter (e.g., "All Leads in Vancouver").

### 3. Smart Status Handling
The enrollment engine respects the current state of the campaign:
*   **Running Campaign**: New leads are added with `pending` status and will be picked up by the next scheduler run.
*   **Paused Campaign**: New leads are added with `paused` status and will only start once the campaign is resumed.

---

## API Endpoints

### Campaign Management

*   `POST /api/v1/campaign/create`: Create a new campaign.
*   `GET /api/v1/campaign/:workspaceId`: List all campaigns in a workspace.
*   `POST /api/v1/campaign/step/create`: Add a new drip step (Email) to a campaign.
*   `POST /api/v1/campaign/start`: Start a campaign for a specific list of leads.
*   `POST /api/v1/campaign/stop`: Pause a running campaign.

### Tag-Based Enrollment (New)

**URL**: `POST /api/v1/campaign/enroll-tag`
**Description**: Fetches all leads associated with a specific Tag (Manual or Dynamic) and enrolls them into the campaign.

**Request Body**:
```json
{
  "campaignId": "64a1b...",
  "tagId": "69f24a32a64d2abc4ed24a41",
  "workspaceId": "69c41e7fe2bc69a5d8e8b2d3"
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "15 leads enrolled in campaign successfully"
}
```

---

## Frontend Implementation Flow (Enrollment UI)

### Bulk Actions Menu
If you are building a "Bulk Actions" or "Lead Management" UI, follow this flow to enroll leads:

1.  **Select Tag**: User selects a Tag from their sidebar or dropdown.
2.  **Select Campaign**: User selects which drip campaign to start.
3.  **Execute**: Call `POST /api/v1/campaign/enroll-tag` with the selected IDs.
4.  **Result**: The backend handles the filtering, formatting, and batch creation. The user receives a success message with the count of enrolled leads.

---

## Postman Testing Example

### Enroll "Hot Leads in Vancouver" into "New Inquiry Drip"
**URL**: `POST {{baseUrl}}/api/v1/campaign/enroll-tag`
**Headers**: `Authorization: Bearer <TOKEN>`

**Body**:
```json
{
  "campaignId": "65b8f1...",
  "tagId": "69f24a32a64d2abc4ed24a41",
  "workspaceId": "69c41e7fe2bc69a5d8e8b2d3"
}
```

**Response**:
```json
{
  "success": true,
  "message": "1 lead(s) enrolled in campaign successfully"
}
```

---

## Technical Integration Note
When a lead is enrolled via Tag:
1.  The API calls `LeadService.getLeads` to resolve the tag (handling dynamic regex/filters).
2.  It creates a `CampaignBatch` for **every step** in the campaign for those leads.
3.  The `runAt` time for each batch is calculated as `Date.now() + step.delayDays`.
