# QueueFlow

A distributed task queue engine built with Node.js and Redis. Clients submit jobs via REST API, workers process them concurrently in the background with retry logic, priority queues, and fault tolerance.

---

## Architecture

Client → POST /jobs → API Server → Redis Queue → Worker → processJob
↑              ↓
Scheduler      Job Status (Redis Hash)
↑              ↓
Delayed Queue    DLQ (after 3 retries)

---

## Features

- Priority queues — high priority jobs always processed first
- Distributed locking — prevents double processing with concurrent workers
- Exponential backoff — failed jobs retry after increasing delays (1s, 2s, 4s)
- Dead letter queue — permanently failed jobs moved to DLQ after 3 retries
- Graceful shutdown — workers finish current job before stopping on SIGTERM
- Job status tracking — query any job by ID for real-time status
- React dashboard — live stats with auto-refresh every 3 seconds

---

## Tech Stack

- Node.js + Express — API server
- Redis — job queue (lists), job status (hashes), distributed locks (strings), delayed jobs (sorted sets)
- React + Vite — dashboard

---

## How to Run

```bash
# Install dependencies
npm install

# Terminal 1 — API server
node index.js

# Terminal 2 — Worker + Scheduler
node worker.entry.js

# Terminal 3 — Dashboard
cd dashboard && npm run dev
```

Submit a job:
```bash
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{"type": "send_email", "priority": "high", "data": {"to": "user@example.com"}}'
```

Check job status:
```bash
curl http://localhost:3000/jobs/{id}
```

---

## Design Decisions & Tradeoffs

**1. Redis lists for the queue instead of MongoDB**

Redis data structures (lists, hashes, sorted sets) give O(1) push/pop operations and sub-millisecond access. MongoDB is optimized for persistent document storage — using it as a queue would mean polling a collection with frequent reads and writes, which is slower and adds unnecessary load. Redis also lets us use the same instance for the queue, job status, distributed locks, and delayed jobs — no extra infrastructure needed.

**2. BRPOP over polling**

BRPOP blocks the worker connection until a job arrives — the worker sleeps efficiently with zero CPU usage when the queue is empty. The alternative (polling with `setInterval`) would make thousands of unnecessary Redis calls per day even with no jobs. BRPOP also has instant response — the worker wakes up the moment a job is pushed.

**3. Exponential backoff for retries**

When a job fails, retrying immediately has a high chance of failing again — the underlying cause (network issue, service down) likely hasn't resolved yet. Exponential backoff waits progressively longer between retries (1s → 2s → 4s), giving the system time to recover. Delayed retries are stored in a Redis sorted set with the executeAt timestamp as the score — a scheduler polls every second and moves due jobs back to the main queue.

**4. At-least-once delivery**

This system guarantees at-least-once delivery — a job will always be processed, but in crash scenarios it might run twice. Exactly-once delivery would require a two-phase commit (atomically marking a job as "in progress" in a transaction log before processing), which adds significant complexity and latency. At-least-once is acceptable for background tasks like sending emails or generating invoices. For payment processing, I would add an idempotency key to detect and skip duplicate executions.