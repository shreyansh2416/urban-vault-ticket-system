# Urban Vault Ticket Management System

A full-stack facility ticket management system built with Django, Django REST Framework, React (Material UI), PostgreSQL, Redis, and Celery.

## Prerequisites
- Docker & Docker Compose
- Node.js (for local frontend development)
- Python 3.10+ 

## Setup & Run Instructions

1. Start the environment:
docker-compose up --build

2. Apply Database Migrations:
docker-compose exec backend python manage.py migrate

3. Load Seed Data (Admin, Techs, Tickets):
docker-compose exec backend python manage.py loaddata seed.json

4. Access the Application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/

## Testing Commands
Run the automated test suite covering API flows, RBAC authorization, state transitions, and Celery retries:
docker-compose exec backend python manage.py test

## Architecture & Engineering Depth Decisions

### 1. Database & Query Optimization (Engineering Depth)
- N+1 Prevention: The TicketViewSet utilizes select_related (for ForeignKeys like client and facility_manager) and prefetch_related (for the Audit Log reverse relationship). This reduces dashboard loading from 50+ queries to just 2 queries.
- Database Indexes: Added db_index=True to the status and created_at fields in the Ticket model, as the dashboard heavily relies on sorting by time and grouping by open/closed states.

### 2. Data Consistency (Engineering Depth)
- Atomic Transactions: The ticket creation API (perform_create) is wrapped in a @transaction.atomic block. This guarantees that if the subsequent TicketAuditLog creation fails, the entire ticket creation rolls back, preventing orphaned records.

### 3. Immutable Audit Trail (Engineering Depth)
- Built a TicketAuditLog relational model that tracks every state transition, assignment, and timestamp. This creates an append-only history feed displayed on the React frontend.

## Celery & Redis Design
Redis acts as the message broker for Celery. Async tasks (like simulated notifications) are routed to the Celery worker. 
- Failure Handling: Tasks are decorated with @shared_task(bind=True, max_retries=3). If an external service is down, Celery uses exponential backoff to retry up to 3 times before logging a fatal failure.

## Assumptions & Limitations
- Assumptions: I assumed the PDF's requirement for a "Client" selection field only applies if the creator has a "Multiple Client Mapping" profile, so I built conditional React logic to toggle this field.
- Limitations: Given the timebox, authentication relies on standard session/token handling rather than a complex OAuth integration. 

## AWS Production Deployment Note
For a live production environment, I would deploy this architecture using the following AWS services:
- Compute: ECS (Fargate) to host the Dockerized Django backend and Celery workers, allowing them to auto-scale independently based on CPU utilization.
- Database: Amazon RDS (PostgreSQL) for automated backups, Multi-AZ redundancy, and connection pooling.
- Cache/Broker: Amazon ElastiCache (Redis) to act as the Celery broker.
- Frontend: The React application would be compiled to static files and hosted on an S3 Bucket distributed via CloudFront CDN for global low-latency delivery.
- Secrets Management: AWS Secrets Manager to inject DATABASE_URL and SECRET_KEY directly into the ECS containers at runtime.

## API Endpoints
- `GET /api/tickets/` - List tickets (Supports `?tab=open/closed`, `?search=`, and filters)
- `POST /api/tickets/` - Create a new ticket
- `GET /api/tickets/{id}/` - Retrieve a specific ticket detail
- `POST /api/tickets/{id}/workflow_action/` - Execute state-machine transitions (assign worker, mark resolved, etc.)

## Actual Time Spent
- Approximately 7-8 hours.

## AI-Assisted Development Disclosure
During the development of this assignment, I utilized AI coding assistants (including Cursor and Gemini) as thought partners. I leveraged them to help scaffold boilerplate Django/React configurations, generate the dummy seed data for testing, debug CSS rendering quirks in Material UI, and format complex query syntax. I independently directed the architectural decisions, designed the state-machine logic, structured the relational models, and implemented the RBAC constraints. I am fully prepared to explain, navigate, and modify all submitted code during the follow-up technical discussion.