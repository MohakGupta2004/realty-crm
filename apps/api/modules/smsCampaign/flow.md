GCP Cloud Scheduler (every 10 min)
        │
        │  POST /api/v1/sms/scheduler
        │  Header: x-internal-secret
        ▼
[ smsScheduler Controller ]
        │
        │  Creates 1 task in sms-master-queue
        │  Returns 200 immediately
        ▼
[ sms-master-queue ]
        │
        │  POST /api/v1/sms/scheduler/worker
        │  Header: x-internal-secret
        ▼
[ smsDispatchWorker Controller ]
        │
        │  processScheduler() runs:
        │  - Self-heals stale DISPATCHING records
        │  - Fetches up to 50 due enrollments
        │  - Bulk leases them as DISPATCHING
        │  - Creates N tasks in sms-dispatch-queue
        │  - Bulk confirms QUEUED_IN_TASKS
        ▼
[ sms-dispatch-queue ]
        │
        │  POST /api/v1/sms/worker/send (per lead)
        │  Header: x-internal-secret
        ▼
[ smsWorker Controller ]
        │  Sends SMS via Twilio
        │  Logs to SMSMessage collection
        │  Schedules next step if exists

