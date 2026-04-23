## GCP Configs

- Master Dispatch Queue
This handles the single cron hand-off. Only one task runs at a time to prevent duplicate DB scans.


```bash
gcloud tasks queues create sms-master-queue \
    --location=YOUR_GCP_REGION \
    --max-dispatches-per-second=1 \
    --max-concurrent-dispatches=1 \
    --max-attempts=5 \
    --min-backoff=30s \
    --max-backoff=600s \
    --max-doublings=3

```

- SMS Send Queue
This handles the actual per-lead SMS dispatch tasks. Concurrency of 10 balances Twilio throughput vs. safety.

```bash
gcloud tasks queues create sms-dispatch-queue \
    --location=YOUR_GCP_REGION \
    --max-dispatches-per-second=5 \
    --max-concurrent-dispatches=10 \
    --max-attempts=3 \
    --min-backoff=5s \
    --max-backoff=60s \
    --max-doublings=2
```
- Create the Cloud Scheduler Job
This is the heartbeat. It fires every 10 minutes and hits 
`/api/v1/sms/scheduler`, which hands off processing to the Master Queue.

```bash
gcloud scheduler jobs create http sms-cron-trigger \
    --location=YOUR_GCP_REGION \
    --schedule="*/10 * * * *" \
    --time-zone="UTC" \
    --uri="https://api.yourdomain.com/api/v1/sms/scheduler" \
    --http-method=POST \
    --headers="Content-Type=application/json,x-internal-secret=YOUR_INTERNAL_SECRET" \
    --attempt-deadline=30s

```

