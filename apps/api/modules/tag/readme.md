# Tagging & Smart Views Module

This module provides a dual-mode tagging system designed for high performance and zero-maintenance scalability.

1.  **Manual Tags**: Labels manually assigned to specific leads (e.g., "Personal Friend").
2.  **Dynamic Tags (Smart Views)**: Real-time segments based on criteria (e.g., "Vancouver Buyers").

---

## Architecture Flow

*   **Manual Tags**: Stored in the `tags` array on the `Lead` document.
*   **Dynamic Tags**: Stored as a "Saved Query" in the `Tag` document. They are never assigned to leads in the DB.
*   **Virtual Badges**: When fetching leads, the API automatically calculates matching dynamic tags using `sift` and appends them to the `tags` array in the JSON response. For the frontend, **all tags look identical**.

---

## The Complete Flow: From Creation to UI Display

### 1. Tag Creation (The Definition)
A user creates a tag through the `POST /api/v1/tag/create` endpoint.
*   **Manual Tag**: This is a simple static label (e.g., "VIP", "Family"). Only the name and color are stored. No rules are required.
*   **Dynamic Tag**: The user provides rules (e.g., `{ "city": "Vancouver", "status": "Buyer" }`). These rules are stored as a MongoDB query object in the `Tag` document. Think of this as a **Saved Search**.

### 2. Assignment (How Leads get tagged)
*   **Manual Tags**: You must use the `POST /api/v1/lead/assign-tags` endpoint. This physically adds the Tag's ID into the lead's `tags` array in the database.
*   **Dynamic Tags**: **Zero database assignment happens.** No fields are updated on the Lead document. The lead "belongs" to the tag automatically because its data matches the rules.

### 3. Fetching Leads (Filtering)
When a user clicks a tag in the sidebar, the `LeadService.getLeads` method handles the branching logic:
1.  **Identify Tag Type**: The system fetches the tag definition by its ID.
2.  **Manual Logic**: If manual, it runs: `Lead.find({ tags: tagId })`. This uses the **Multikey Index** on the `tags` array for instant results.
3.  **Dynamic Logic**: If dynamic, it takes the saved `filters` and spreads them into the query: `Lead.find({ ...query, ...tag.filters })`. This treats the tag as a "Smart Folder."

### 4. Visualization (The Virtual Badges & Sift Matcher)
This is the "magic" that makes the UI look consistent. Even when you are just viewing "All Leads" (not filtering by a tag), the badges for Dynamic tags still appear.
1.  **DB Fetch**: MongoDB brings in the leads and populates the `tags` array (containing the Manual labels).
2.  **Pre-compilation**: The API fetches all Dynamic Tag definitions for the workspace. Using the `sift` library, it "compiles" these filters into fast Javascript functions.
3.  **The Matching Loop**: As the API prepares the JSON response for the 50 leads on your screen, it runs each lead through the pre-compiled matchers. 
4.  **Injection**: If a lead matches a dynamic rule, the API **injects** that tag object into the `tags` array for that specific response only.
5.  **Unified Response**: The Frontend receives a clean array of leads where the `tags` field contains both manually assigned labels and virtually matching dynamic badges.

---

## Lifecycle Comparison

| Feature | Manual Tag | Dynamic Tag (Smart View) |
| :--- | :--- | :--- |
| **Storage on Lead** | Stored in DB `tags` array | **Not stored** (Virtual) |
| **Assignment** | Manual via API | **Automatic** based on lead data |
| **Updates** | User must manually add/remove | **Instant** when Lead data changes |
| **Scalability** | High (Indexed array search) | **Highest** (Calculated only for visible leads) |
| **Accuracy** | Can get stale if not updated | **100% Guaranteed Accurate** |

---

## Technical Architecture Logic

*   **Database Cleanliness**: We avoid "bloating" the Lead documents with hundreds of dynamic tag IDs. This prevents your database from slowing down as you add more tags.
*   **Scalable Virtualization**: The CPU cost of matching leads against tags happens only for the 50 leads currently being viewed. This is $O(PageSize)$, making it just as fast if you have 1,000 leads or 1,000,000 leads.
*   **Pre-compiled Matchers**: By using `sift` matchers compiled outside the loop, we eliminate the overhead of parsing query logic for every lead, ensuring sub-millisecond badge generation.

---

## API Endpoints

### Tag Definition (`/api/v1/tag`)

*   `POST /api/v1/tag/create`: Create a new Tag. Requires `x-workspace-id` header.
    *   Body: `{ "name": string, "type": "MANUAL" | "DYNAMIC", "filters"?: object, "color"?: string }`
*   `GET /api/v1/tag/list`: List all tags in the workspace. Requires `x-workspace-id` header.
*   `PATCH /api/v1/tag/:id`: Update tag metadata or filters.
*   `DELETE /api/v1/tag/:id`: Delete a tag definition.

### Lead Tagging (`/api/v1/lead`)

*   `POST /api/v1/lead/assign-tags`: Bulk assign a **MANUAL** tag to lead IDs.
    *   Body: `{ "leadIds": string[], "tagId": string }`
*   `POST /api/v1/lead/remove-tags`: Bulk remove a manual tag from lead IDs.
    *   Body: `{ "leadIds": string[], "tagId": string }`
*   `GET /api/v1/lead/workspace/:workspaceId?tagId=...`: Fetch leads, optionally filtered by a specific Manual or Dynamic tag.

---

## Frontend Integration Note
The Lead object in the response will always have a unified `tags` array:
```json
"tags": [
  { "_id": "...", "name": "Friend", "type": "MANUAL", "color": "..." },
  { "_id": "...", "name": "Vancouver Buyers", "type": "DYNAMIC", "color": "..." }
]
```
The UI doesn't need to know the difference between Manual and Dynamic for display purposes; it should simply render all objects in the `tags` array as badges.

---

## Postman Testing Examples

### 1. Create a Manual Tag
**URL**: `POST {{baseUrl}}/api/v1/tag/create`
**Headers**: `x-workspace-id: YOUR_WORKSPACE_ID`
**Body**:
```json
{
  "name": "VIP Client",
  "color": "#EF4444",
  "type": "MANUAL"
}
```

### 2. Create a Dynamic Tag (Smart Filter)
**URL**: `POST {{baseUrl}}/api/v1/tag/create`
**Headers**: `x-workspace-id: YOUR_WORKSPACE_ID`
**Body**:
```json
{
  "name": "Hot Leads in Vancouver",
  "color": "#F59E0B",
  "type": "DYNAMIC",
  "filters": {
    "city": "Vancouver",
    "status": "New Inquiry"
  }
}
```

### 3. Assign Manual Tag to Leads
**URL**: `POST {{baseUrl}}/api/v1/lead/assign-tags`
**Headers**: `x-workspace-id: YOUR_WORKSPACE_ID`
**Body**:
```json
{
  "leadIds": ["64a1b...", "64a1c..."],
  "tagId": "PASTE_MANUAL_TAG_ID_HERE"
}
```

### 4. Fetch Leads Filtered by Tag (Manual or Dynamic)
**URL**: `GET {{baseUrl}}/api/v1/lead/workspace/YOUR_WORKSPACE_ID?tagId=PASTE_TAG_ID_HERE`
**Headers**: `x-workspace-id: YOUR_WORKSPACE_ID`

### 5. Update Dynamic Tag Filters
**URL**: `PATCH {{baseUrl}}/api/v1/tag/PASTE_TAG_ID_HERE`
**Headers**: `x-workspace-id: YOUR_WORKSPACE_ID`
**Body**:
```json
{
  "filters": {
    "city": "Seattle",
    "status": "Qualified"
  }
}
```

