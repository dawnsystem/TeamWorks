# Docker Setup Guide - TeamWorks

Complete guide for running TeamWorks using Docker and Docker Compose.

## Prerequisites

- Docker Engine 24.0 or higher
- Docker Compose 2.20 or higher
- 2GB+ available RAM
- 5GB+ available disk space

## Quick Start

### 1. Clone and Configure

```bash
# Clone the repository (if not already done)
git clone https://github.com/dawnsystem/TeamWorks.git
cd TeamWorks

# Create environment file
cp .env.example .env

# Edit .env and update at minimum:
# - POSTGRES_PASSWORD
# - JWT_SECRET
# - GROQ_API_KEY or GEMINI_API_KEY (for AI features)
```

### 2. Build and Start

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 3. Access the Application

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3000
- **API Health:** http://localhost:3000/health
- **Database:** localhost:5432

### 4. Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database data)
docker-compose down -v
```

## Architecture

```
┌─────────────────────────────────────────┐
│          Docker Network                  │
│                                          │
│  ┌──────────────┐   ┌──────────────┐   │
│  │   Frontend   │   │   Backend    │   │
│  │  (Nginx)     │   │  (Node.js)   │   │
│  │  Port: 8080  │   │  Port: 3000  │   │
│  └──────────────┘   └──────────────┘   │
│         │                   │            │
│         │                   │            │
│         │           ┌───────┴────────┐  │
│         │           │   PostgreSQL    │  │
│         │           │   Port: 5432    │  │
│         │           └────────────────┘  │
│         │                                │
└─────────┴────────────────────────────────┘
          │
      [Host Port]
```

## Service Details

### Frontend (client/)

- **Image:** nginx:alpine
- **Port:** 8080 (configurable via `FRONTEND_PORT`)
- **Build:** Multi-stage with Node.js for build, nginx for serving
- **Features:**
  - SPA routing support
  - Gzip compression
  - Static asset caching
  - Security headers
  - Health check endpoint

### Backend (server/)

- **Image:** node:20-alpine
- **Port:** 3000 (configurable via `BACKEND_PORT`)
- **Build:** Multi-stage for optimized production image
- **Features:**
  - Production-only dependencies
  - Non-root user execution
  - Automatic Prisma Client generation
  - Health check endpoint
  - Structured logging

### Database

- **Image:** postgres:16-alpine
- **Port:** 5432 (configurable via `POSTGRES_PORT`)
- **Features:**
  - Persistent volume
  - Health checks
  - Automatic initialization

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | Database password | `secure-password-123` |
| `JWT_SECRET` | Secret for JWT tokens | `long-random-string-here` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `POSTGRES_DB` | Database name | `teamworks` |
| `POSTGRES_USER` | Database user | `teamworks` |
| `POSTGRES_PORT` | Database port | `5432` |
| `BACKEND_PORT` | Backend API port | `3000` |
| `FRONTEND_PORT` | Frontend web port | `8080` |
| `GROQ_API_KEY` | Groq AI API key | - |
| `GEMINI_API_KEY` | Google Gemini API key | - |
| `LOG_LEVEL` | Log verbosity | `info` |

## Development Workflow

### Building Images

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend

# Build without cache
docker-compose build --no-cache
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database

# Last 100 lines
docker-compose logs --tail=100
```

### Executing Commands

```bash
# Backend shell
docker-compose exec backend sh

# Database shell
docker-compose exec database psql -U teamworks -d teamworks

# Run Prisma migrations
docker-compose exec backend npm run prisma:migrate

# Run tests
docker-compose exec backend npm test
```

### Database Management

```bash
# Create backup
docker-compose exec database pg_dump -U teamworks teamworks > backup.sql

# Restore backup
docker-compose exec -T database psql -U teamworks teamworks < backup.sql

# Reset database (WARNING: deletes all data)
docker-compose down database -v
docker-compose up -d database
```

## Production Deployment

### Security Checklist

- [ ] Change default passwords in `.env`
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS/SSL (use reverse proxy like Traefik or nginx)
- [ ] Set proper CORS origins
- [ ] Review and set appropriate LOG_LEVEL
- [ ] Enable database backups
- [ ] Set resource limits (see below)

### Resource Limits

Add to `docker-compose.yml` for production:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
          
  frontend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 128M
        reservations:
          cpus: '0.25'
          memory: 64M
          
  database:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Reverse Proxy Setup

Example nginx configuration for HTTPS:

```nginx
upstream teamworks-backend {
    server localhost:3000;
}

upstream teamworks-frontend {
    server localhost:8080;
}

server {
    listen 443 ssl http2;
    server_name teamworks.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Frontend
    location / {
        proxy_pass http://teamworks-frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Backend API
    location /api {
        proxy_pass http://teamworks-backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SSE support
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
    }
}
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check Docker daemon
docker info

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Issues

```bash
# Check database health
docker-compose exec database pg_isready -U teamworks

# Verify DATABASE_URL
docker-compose exec backend printenv DATABASE_URL

# Check network connectivity
docker-compose exec backend ping database
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3000
lsof -i :8080
lsof -i :5432

# Change ports in .env
BACKEND_PORT=3001
FRONTEND_PORT=8081
POSTGRES_PORT=5433
```

### Build Failures

```bash
# Check Dockerfile syntax
docker build -t test ./server
docker build -t test ./client

# Check available disk space
df -h

# Clean Docker cache
docker system prune -a
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Increase Docker memory limit (Docker Desktop)
# Settings > Resources > Memory

# Check logs for errors
docker-compose logs --tail=100
```

## Updating

### Pull Latest Changes

```bash
# Pull repository updates
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Update Dependencies

```bash
# Backend
docker-compose exec backend npm update
docker-compose exec backend npm audit fix

# Frontend
docker-compose exec frontend sh
# (inside container) npm update
# (inside container) npm audit fix
```

## Monitoring

### Health Checks

```bash
# Frontend
curl http://localhost:8080/health

# Backend
curl http://localhost:3000/health

# Database
docker-compose exec database pg_isready -U teamworks
```

### Metrics

```bash
# Backend metrics endpoint
curl http://localhost:3000/metrics

# Docker stats
docker stats teamworks-backend teamworks-frontend teamworks-database
```

## Backup and Restore

### Automated Backup Script

Create `backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T database pg_dump -U teamworks teamworks | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup volumes
docker run --rm -v teamworks_postgres_data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/volumes_$DATE.tar.gz -C /data .

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
echo "Backup completed: $BACKUP_DIR/volumes_$DATE.tar.gz"
```

### Restore from Backup

```bash
# Stop services
docker-compose down

# Restore volume
docker run --rm -v teamworks_postgres_data:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/volumes_TIMESTAMP.tar.gz -C /data

# Start services
docker-compose up -d
```

## Advanced Configuration

### Custom Docker Networks

```yaml
networks:
  teamworks-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Volume Mounting for Development

```yaml
services:
  backend:
    volumes:
      - ./server/src:/app/src:ro
      - ./server/prisma:/app/prisma:ro
```

### Multiple Environments

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    environment:
      NODE_ENV: production
      LOG_LEVEL: warn
```

Use with:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## FAQ

**Q: Can I use this in production?**  
A: Yes, but review the security checklist and consider using a reverse proxy with HTTPS.

**Q: How do I scale services?**  
A: Use `docker-compose up -d --scale backend=3` (requires load balancer).

**Q: Can I use a different database?**  
A: The application is designed for PostgreSQL. Other databases would require code changes.

**Q: How do I migrate from local development?**  
A: Export your local database and import it into the Docker database container.

**Q: What about hot reload in development?**  
A: This setup is for production. For development, use the native npm scripts with volume mounting.

## Support

- GitHub Issues: https://github.com/dawnsystem/TeamWorks/issues
- Documentation: See main README.md
- Docker Docs: https://docs.docker.com/

---

**Last Updated:** 2025-11-05  
**Docker Version:** 24.0+  
**Docker Compose Version:** 2.20+
