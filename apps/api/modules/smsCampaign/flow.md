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
        │  Checks if Campaign is Active (If false, aborts & sets PAUSED_BY_CAMPAIGN)
        │  Sends SMS via Twilio
        │  Logs to SMSMessage collection
        │  Schedules next step if exists

---

## Campaign Pause / Resume Flow

[ Frontend ]
        │
        │  POST /api/v1/sms/campaign/:id/pause
        ▼
[ API Controller ]
        │
        │  Sets SMSCampaign.isActive = false
        │  Updates all 'AWAITING_CRON' / 'DISPATCHING' enrollments to 'PAUSED_BY_CAMPAIGN'
        ▼
[ sms-dispatch-queue (In-Flight Tasks) ]
        │
        │  Timer Pops -> calls smsWorker Controller
        │  Worker sees campaign is inactive -> Aborts Twilio send -> Updates to 'PAUSED_BY_CAMPAIGN'

---

[ Frontend ]
        │
        │  POST /api/v1/sms/campaign/:id/resume
        ▼
[ API Controller ]
        │
        │  Sets SMSCampaign.isActive = true
        │  Updates all 'PAUSED_BY_CAMPAIGN' to 'AWAITING_CRON' (nextSmsTime = now)
        │  Next Scheduler Tick (every 10 min) picks them up instantly
