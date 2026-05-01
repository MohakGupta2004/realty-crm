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

## Advanced Dynamic Filtering (Smart Views)

The `filters` object supports full MongoDB query syntax, allowing for extremely flexible segmenting.

### 1. Standard Fields (Exact Match)
```json
{ "city": "Vancouver", "status": "New Inquiry" }
```
> [!TIP]
> **Total Case-Insensitivity**: The system automatically handles casing for **ALL** fields (Standard and Custom). You can create tags using any casing (e.g., "Vancouver", "vancouver", "VANCOUVER") and they will match correctly. No manual regex or lowercase formatting is required from your side.

### 2. Custom Data (`extra_fields`)
Use **Dot Notation** to filter data stored inside the `extra_fields` object.
```json
{
  "extra_fields.budget": { "$gte": 500000 },
  "extra_fields.property_type": "Condo",
  "extra_fields.is_priority": true
}
```

### 3. Range & Comparison Operators
*   `$gt` / `$gte`: Greater than (or equal)
*   `$lt` / `$lte`: Less than (or equal)
*   `$ne`: Not equal
```json
{ "extra_fields.score": { "$gt": 80 } }
```

### 4. Matching Multiple Values (`$in`)
Match a lead if a field contains any of the values in a list.
```json
{ "source": { "$in": ["Facebook", "Instagram", "TikTok"] } }
```

### 5. Existence Checks (`$exists`)
Find leads that have (or don't have) a specific custom field.
```json
{ "extra_fields.referral_source": { "$exists": true } }
```

### 6. Advanced Text Matching (Regex)
Use regex for partial matches or case-insensitive search on fields that are NOT automatically lowercased (like `name`).
```json
{ "name": { "$regex": "John", "$options": "i" } }
```

---

## API Endpoints

### Tag Definition (`/api/v1/tag`)

*   `POST /api/v1/tag/create`: Create a new Tag. Requires `x-workspace-id` header.
    *   Body: `{ "name": string, "type": "MANUAL" | "DYNAMIC", "filters"?: object, "color"?: string }`
*   `GET /api/v1/tag/list`: List all tags in the workspace. Requires `x-workspace-id` header.
*   `GET /api/v1/tag/filter-schema`: **Dynamic Schema Discovery**. Returns all available fields for building filters (Standard + unique custom `extra_fields` found in the workspace).
*   `PATCH /api/v1/tag/:id`: Update tag metadata or filters.

---

## UI Integration: Building a Dynamic Tag Builder

To build a "No-Code" tag builder in your UI, use the `filter-schema` endpoint. It provides the metadata needed to dynamically generate a filter dropdown.

### Schema Discovery Endpoint
`GET /api/v1/tag/filter-schema`

**What it returns:**
1.  **Standard Fields**: A hardcoded list of lead fields (`city`, `status`, `source`, etc.) with their UI labels and types.
2.  **Discovered Custom Fields**: It automatically scans the most recent 1,000 leads in the workspace and finds all unique keys inside the `extra_fields` object.
    *   **Auto-Formatting**: Keys like `budget_limit` are automatically converted to human-readable labels like `"Budget Limit"`.
    *   **Direct Key Mapping**: Custom keys are prefixed with `extra_fields.` (e.g., `extra_fields.budget_limit`) so the frontend can map them directly to the filter object.

**Example Response:**
```json
{
  "standard": [
    { "key": "city", "label": "City", "type": "text" },
    { "key": "status", "label": "Current Status", "type": "text" }
  ],
  "custom": [
    { "key": "extra_fields.budget", "label": "Budget", "type": "custom" },
    { "key": "extra_fields.property_type", "label": "Property Type", "type": "custom" }
  ]
}
```

### Why this is powerful:
*   **Zero Configuration**: If a user imports 10,000 leads with a new column `"Mortgage Pre-approved"`, that field will **instantly** appear as a filter option in the Tag creation UI without any frontend code changes.
*   **Performance**: The discovery logic uses a highly optimized MongoDB aggregation capped at 1,000 leads, ensuring the API remains fast even with millions of records.

---

*   `DELETE /api/v1/tag/:id`: Delete a tag definition.

### Lead Tagging (`/api/v1/lead`)

*   `POST /api/v1/lead/assign-tags`: Bulk assign a **MANUAL** tag to lead IDs.
    *   Body: `{ "leadIds": string[], "tagId": string }`
*   `POST /api/v1/lead/remove-tags`: Bulk remove a manual tag from lead IDs.
    *   Body: `{ "leadIds": string[], "tagId": string }`
*   `GET /api/v1/lead/workspace/:workspaceId?tagId=...`: Fetch leads, optionally filtered by a specific Manual or Dynamic tag.

---

## Postman Testing Examples

### 1. Create a Dynamic Tag
**URL**: `POST {{baseUrl}}/api/v1/tag/create`
**Headers**: `x-workspace-id: 69c41e7fe2bc69a5d8e8b2d3`

**Request Body**:
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

**Success Response (201)**:
```json
{
  "name": "Hot Leads in Vancouver",
  "color": "#F59E0B",
  "userId": "69c416fc7b890371a54c0d5d",
  "workspaceId": "69c41e7fe2bc69a5d8e8b2d3",
  "type": "DYNAMIC",
  "filters": {
    "city": "Vancouver",
    "status": "New Inquiry"
  },
  "_id": "69f24a32a64d2abc4ed24a41",
  "createdAt": "2026-04-29T18:13:06.252Z",
  "updatedAt": "2026-04-29T18:13:06.252Z"
}
```

### 2. Assign Manual Tag to Leads
**URL**: `POST {{baseUrl}}/api/v1/lead/assign-tags`
**Headers**: `x-workspace-id: 69c41e7fe2bc69a5d8e8b2d3`

**Request Body**:
```json
{
  "leadIds": ["69f2318921000eb637da1d45"],
  "tagId": "69f22ae67fedd3b19f6e0c25"
}
```

**Response (200)**:
```json
{
  "success": true,
  "modifiedCount": 1
}
```

### 3. List All Tags in Workspace
**URL**: `GET {{baseUrl}}/api/v1/tag/list`
**Headers**: `x-workspace-id: 69c41e7fe2bc69a5d8e8b2d3`

**Response (200)**:
```json
[
  {
    "_id": "69f22ae67fedd3b19f6e0c25",
    "name": "PRAMIT TAG",
    "color": "blue",
    "userId": "69c416fc7b890371a54c0d5d",
    "workspaceId": "69c41e7fe2bc69a5d8e8b2d3",
    "type": "MANUAL",
    "createdAt": "2026-04-29T15:59:34.541Z",
    "updatedAt": "2026-04-29T15:59:34.541Z"
  }
]
```

### 4. Fetch Leads with Merged Tags (Manual + Virtual)
**URL**: `GET {{baseUrl}}/api/v1/lead/workspace/69c41e7fe2bc69a5d8e8b2d3`

**Response (200)**:
```json
{
  "leads": [
    {
      "_id": "69f2318921000eb637da1d45",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "New Inquiry",
      "tags": [
        {
          "_id": "69f22ae67fedd3b19f6e0c25",
          "name": "PRAMIT TAG",
          "color": "blue",
          "type": "MANUAL"
        }
      ]
    }
  ]
}
```

### 5. Filtering by Dynamic Tag (Smart View)
**URL**: `GET {{baseUrl}}/api/v1/lead/workspace/69c41e7fe2bc69a5d8e8b2d3?tagId=69f24a32a64d2abc4ed24a41`

**Success Response (200)**:
```json
{
    "leads": [
        {
            "_id": "69f24a20a64d2abc4ed24a32",
            "name": "John Doe 2 Test",
            "email": "john2@example.com",
            "city": "Vancouver",
            "status": "New Inquiry",
            "tags": [
                {
                    "_id": "69f24a32a64d2abc4ed24a41",
                    "name": "Hot Leads in Vancouver",
                    "color": "#F59E0B",
                    "type": "DYNAMIC",
                    "filters": {
                        "city": "Vancouver",
                        "status": "New Inquiry"
                    }
                }
            ]
        }
    ]
}
```



---

## Frontend Implementation Flow (Tag Creation UI)

"Tag Creation" UI flow:

### Step 1: Initialize the Filter Builder
Call `GET /api/v1/tag/filter-schema`.
*   **Standard Fields**: Populate your primary dropdown with these (City, Status, etc.).
*   **Custom Fields**: Populate the "Custom Fields" section of your dropdown with the `custom` array.
*   **User Experience**: This ensures that even if a new custom field was just added to a lead, it shows up in your UI immediately.

### Step 2: Build the Filter Logic
When the user picks a field and a value (e.g., "Budget" > "500000"):
*   Use the `key` provided in the schema (`extra_fields.budget`) as the JSON key.
*   If it's a range, use MongoDB operators: `{ "extra_fields.budget": { "$gte": 500000 } }`.

### Step 3: Save the Tag
Send the constructed `filters` object to `POST /api/v1/tag/create`.
*   Set `type: "DYNAMIC"` to make it an automatic "Smart View".
*   Set `type: "MANUAL"` if the user just wants a static label.

### Step 4: Displaying Tags (List & Details)
On the Lead list or Lead details pages:
*   The API returns a unified `tags` array for every lead.
*   **Don't check for types**: Just iterate through `lead.tags` and render each item as a badge using its `name` and `color`. The API handles the "virtual" logic for you.

---

## Frontend Integration Note
The Lead object in the response will always have a unified `tags` array:
```json
"tags": [
  { "_id": "...", "name": "Friend", "type": "MANUAL", "color": "..." },
  { "_id": "...", "name": "Luxury Condo Buyers", "type": "DYNAMIC", "color": "..." }
]
```
The UI should simply render all objects in the `tags` array as badges.

