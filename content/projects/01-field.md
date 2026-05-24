---
title: Field Monitor
subtitle: Real-time IoT sensor dashboard for agricultural edge devices
year: 2024
role: Backend Lead
team: 3 engineers
stack:
  - Go
  - NATS
  - ClickHouse
  - Vue 3
cover: /images/projects/field-cover.jpg
screens:
  - /images/projects/field-screen-1.jpg
  - /images/projects/field-screen-2.jpg
date: 2024-06-01
---

## Brief

Field Monitor is a real-time telemetry dashboard for agricultural IoT sensors deployed at the network edge. Farmers and agronomists use it to track soil moisture, temperature, and humidity across multiple zones from a single interface.

The system handles thousands of concurrent sensor connections, persists time-series data efficiently, and delivers live updates to browser clients without polling.

## Process

The project started with a proof-of-concept using WebSockets and PostgreSQL. Early load tests showed that relational storage couldn't keep up with the write throughput from 500+ concurrent sensors.

We migrated to ClickHouse for time-series persistence and introduced NATS as the message broker between edge agents and the backend API. The frontend moved to Server-Sent Events, which simplified client reconnection logic and reduced server overhead.

Deployment runs on bare-metal nodes at the farm co-location, with a lightweight Go agent compiled for ARMv7 on each sensor gateway.

## Tech Decisions

The core architectural challenge was decoupling sensor ingestion from dashboard delivery without introducing complex distributed systems.

```mermaid
flowchart LR
    Sensor["IoT Sensor (ARM)"] -->|MQTT| Gateway
    Gateway -->|NATS Publish| Broker["NATS Broker"]
    Broker -->|Subscribe| API["Go API Server"]
    API -->|INSERT| CH["ClickHouse"]
    API -->|SSE| Browser["Vue Dashboard"]
    CH -->|Query| API
```

NATS was chosen over Kafka because the message volume didn't justify Kafka's operational overhead, and NATS's at-most-once delivery was acceptable for live telemetry (missing one reading is fine; duplicating one is not).

ClickHouse's columnar storage and built-in time-bucketing functions (`toStartOfInterval`) made rollup queries fast without a separate aggregation pipeline.
