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
- Docker + Docker Compose — containerization and local orchestration

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

## Running with Docker

The entire stack (API, Worker, Redis, Dashboard) runs with a single command — no local Redis install or multiple terminals needed.

```bash
# Build images and start all services
docker compose up --build

# Run in the background
docker compose up --build -d

# View logs
docker compose logs -f

# View logs for one service (api / worker / redis / dashboard)
docker compose logs -f worker

# Stop everything
docker compose down

# Stop and wipe Redis data
docker compose down -v
```

**Services:**

| Service | What it runs | Port |
|---|---|---|
| `redis` | Redis 7 | internal only |
| `api` | Express API server | localhost:3000 |
| `worker` | Job processor + scheduler | — |
| `dashboard` | React dashboard (nginx) | localhost:5173 |

**Environment variables:**

| Variable | Default | Description |
|---|---|---|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |

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

**5. One Dockerfile for API and Worker**

The API server and worker share the same codebase, so they use the same Docker image. Docker Compose overrides the `CMD` for the worker service (`command: node worker.entry.js`) instead of maintaining two separate Dockerfiles. This keeps images in sync — a single build produces one artifact that serves both processes.

**6. Multi-stage build for the dashboard**

The React dashboard is built in a Node.js stage (which includes Vite and all dev dependencies), but the final image is just nginx serving the compiled static files. The Node.js runtime never ships to production. This reduces the dashboard image size from ~400MB to ~25MB.