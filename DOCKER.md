# Docker Deployment Guide

Deploy all four stacks simultaneously with **one command** using Docker Compose + Traefik!

---

## 🚀 Quick Start (One Command!)

```bash
# From project root
docker-compose up -d

# Wait for all services to start (~2 minutes first time)
docker-compose ps

# Access the stacks:
# Flask:    http://flask.localhost
# Astro:    http://astro.localhost
# TanStack: http://tanstack.localhost
# Angular:  http://angular.localhost
# Traefik Dashboard: http://localhost:8080
```

That's it! All four stacks are now running and accessible through Traefik reverse proxy.

---

## 📋 Architecture Overview

```
                    ┌─────────────────┐
                    │   Traefik       │
                    │ (Reverse Proxy) │
                    │   Port 80       │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        │                    │                    │
   ┌────▼─────┐        ┌────▼─────┐        ┌────▼─────┐
   │  Flask   │        │  Astro   │        │ TanStack │
   │  :5000   │        │  :4321   │        │  :3000   │
   └────┬─────┘        └────┬─────┘        └────┬─────┘
        │                   │                    │
        │              ┌────▼─────┐              │
        │              │ Angular  │              │
        │              │  :4200   │              │
        │              └────┬─────┘              │
        │                   │                    │
        └───────────────────┴────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   PostgreSQL   │
                    │     :5432      │
                    └────────────────┘
                            │
                    ┌───────▼────────┐
                    │     Redis      │
                    │     :6379      │
                    └────────────────┘
```

**Benefits:**
- ✅ Single command deployment
- ✅ Automatic service discovery
- ✅ Load balancing built-in
- ✅ Health checks for all services
- ✅ Shared database for all stacks
- ✅ Easy A/B testing between stacks

---

## 🛠️ Prerequisites

### Required Software
```bash
# Docker (20.10+)
curl -fsSL https://get.docker.com | sh

# Docker Compose (2.0+) - usually included with Docker
docker-compose --version

# Add your user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker
```

### Configure /etc/hosts (for .localhost domains)

Add these entries to `/etc/hosts`:

```bash
# Social Audit - Docker Compose
127.0.0.1 flask.localhost
127.0.0.1 astro.localhost
127.0.0.1 tanstack.localhost
127.0.0.1 angular.localhost
127.0.0.1 traefik.localhost
```

**One-liner:**
```bash
echo "127.0.0.1 flask.localhost astro.localhost tanstack.localhost angular.localhost traefik.localhost" | sudo tee -a /etc/hosts
```

---

## 📦 Services Included

### 1. **Traefik** (Reverse Proxy)
- **URL**: http://localhost:8080 (Dashboard)
- **Purpose**: Routes requests to correct stack based on hostname
- **Features**:
  - Automatic service discovery
  - Health checks
  - Load balancing
  - Access logs

### 2. **PostgreSQL** (Database)
- **Port**: 5432
- **Database**: `social_audit`
- **User**: `social_user`
- **Password**: `social_pass_2026`
- **Shared by**: All four stacks

### 3. **Redis** (Cache & Background Jobs)
- **Port**: 6379
- **Purpose**: Flask session storage, Celery tasks

### 4. **Flask Stack**
- **URL**: http://flask.localhost
- **Port**: 5000 (internal)
- **Stack**: Python 3.12 + uv + Flask 3.1 + Gunicorn

### 5. **Astro Stack**
- **URL**: http://astro.localhost
- **Port**: 4321 (internal)
- **Stack**: Astro 6 + Svelte 5 + Bun

### 6. **TanStack Stack**
- **URL**: http://tanstack.localhost
- **Port**: 3000 (internal)
- **Stack**: React 19 + TanStack Start + Bun

### 7. **Angular Stack**
- **URL**: http://angular.localhost
- **Port**: 4200 (internal)
- **Stack**: Angular 21 + Signals + Nginx

---

## 🎯 Common Commands

### Start All Services
```bash
docker-compose up -d
```

### Stop All Services
```bash
docker-compose down
```

### View Logs (all services)
```bash
docker-compose logs -f
```

### View Logs (specific service)
```bash
docker-compose logs -f flask      # Flask stack
docker-compose logs -f astro      # Astro stack
docker-compose logs -f tanstack   # TanStack stack
docker-compose logs -f angular    # Angular stack
docker-compose logs -f postgres   # Database
docker-compose logs -f traefik    # Reverse proxy
```

### Restart a Service
```bash
docker-compose restart flask
docker-compose restart astro
```

### Rebuild After Code Changes
```bash
# Rebuild specific service
docker-compose up -d --build flask

# Rebuild all services
docker-compose up -d --build
```

### Check Service Status
```bash
docker-compose ps

# Expected output:
# NAME                    STATUS          PORTS
# social-audit-flask      Up (healthy)    
# social-audit-astro      Up (healthy)    
# social-audit-tanstack   Up (healthy)    
# social-audit-angular    Up (healthy)    
# social-audit-db         Up (healthy)    0.0.0.0:5432->5432/tcp
# social-audit-redis      Up (healthy)    0.0.0.0:6379->6379/tcp
# social-audit-traefik    Up              0.0.0.0:80->80/tcp, 0.0.0.0:8080->8080/tcp
```

### Access Container Shell
```bash
# Flask (Python shell)
docker-compose exec flask python

# Astro (Bun shell)
docker-compose exec astro bun

# PostgreSQL (psql)
docker-compose exec postgres psql -U social_user -d social_audit
```

### Clean Up Everything (including volumes)
```bash
docker-compose down -v
docker system prune -a --volumes
```

---

## 🧪 Testing the Deployment

### 1. Check Traefik Dashboard
```bash
open http://localhost:8080
# Or visit in browser
```

You should see all 4 routers (flask, astro, tanstack, angular) in green.

### 2. Test Each Stack
```bash
# Flask
curl http://flask.localhost

# Astro
curl http://astro.localhost

# TanStack
curl http://tanstack.localhost

# Angular
curl http://angular.localhost
```

### 3. Test Database Connection
```bash
docker-compose exec postgres psql -U social_user -d social_audit -c "SELECT COUNT(*) FROM users;"
```

### 4. Load Test with Apache Bench
```bash
# Test Flask endpoint
ab -n 1000 -c 10 http://flask.localhost/

# Compare with Astro
ab -n 1000 -c 10 http://astro.localhost/

# Compare with TanStack
ab -n 1000 -c 10 http://tanstack.localhost/

# Compare with Angular
ab -n 1000 -c 10 http://angular.localhost/
```

---

## 🔧 Configuration

### Environment Variables

Edit `docker-compose.yml` to change:

```yaml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: your-secure-password  # Change this!
      
  flask:
    environment:
      SECRET_KEY: your-secret-key  # Change this!
      DATABASE_URL: postgresql://...
```

### Custom Ports

To use different ports, edit `docker-compose.yml`:

```yaml
services:
  traefik:
    ports:
      - "8080:80"      # Change 8080 to your desired port
      - "8888:8080"    # Traefik dashboard
```

### Add More Replicas (Load Balancing)

```yaml
services:
  flask:
    deploy:
      replicas: 3  # Run 3 Flask instances
```

Traefik will automatically load-balance between them!

---

## 📊 Performance Monitoring

### Traefik Metrics

View in dashboard: http://localhost:8080

Metrics include:
- Requests per second
- Response times
- Error rates
- Active connections

### Resource Usage

```bash
# Container stats
docker stats

# Output:
# CONTAINER           CPU %     MEM USAGE / LIMIT     NET I/O
# social-audit-flask  2.5%      150MB / 2GB          1.2MB / 890KB
# social-audit-astro  1.8%      120MB / 2GB          980KB / 650KB
# ...
```

### Database Performance

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U social_user -d social_audit

# Check slow queries
SELECT * FROM pg_stat_activity WHERE state != 'idle';

# Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🚀 Production Considerations

### Security

1. **Change default passwords**
   ```yaml
   POSTGRES_PASSWORD: use-strong-password-here
   SECRET_KEY: use-cryptographically-secure-key
   ```

2. **Enable HTTPS**
   ```yaml
   traefik:
     command:
       - "--certificatesresolvers.letsencrypt.acme.email=you@example.com"
       - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
   ```

3. **Disable Traefik dashboard**
   ```yaml
   - "--api.dashboard=false"
   ```

### Scaling

```bash
# Scale Flask to 5 instances
docker-compose up -d --scale flask=5

# Traefik auto-balances across all instances
```

### Backups

```bash
# Backup database
docker-compose exec postgres pg_dump -U social_user social_audit > backup.sql

# Restore database
docker-compose exec -T postgres psql -U social_user social_audit < backup.sql
```

---

## 🐛 Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose logs

# Common issues:
# 1. Port already in use
sudo lsof -i :80
sudo lsof -i :5432

# 2. Permission issues
sudo chown -R $USER:$USER .

# 3. Database not ready
docker-compose up -d postgres
# Wait 30s
docker-compose up -d
```

### Database connection errors

```bash
# Check PostgreSQL is healthy
docker-compose ps postgres

# Check connection from Flask
docker-compose exec flask python -c "import psycopg2; psycopg2.connect('postgresql://social_user:social_pass_2026@postgres:5432/social_audit')"
```

### Traefik routing issues

```bash
# Check Traefik logs
docker-compose logs traefik

# Verify labels
docker inspect social-audit-flask | grep traefik
```

### Out of disk space

```bash
# Remove unused images
docker system prune -a

# Check disk usage
docker system df

# Remove volumes (CAUTION: deletes data)
docker-compose down -v
```

---

## 📚 Learn More

- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Flask Deployment Guide](flask-stack/README.md)
- [Astro Deployment Guide](astro-stack/README.md)
- [TanStack Deployment Guide](tanstack-stack/README.md)
- [Angular Deployment Guide](angular-stack/README.md)

---

## 🎉 Success!

You now have a fully containerized, production-ready deployment of all four stacks running simultaneously with automatic load balancing and health checks!

**Compare the stacks side-by-side:**
- Open http://flask.localhost in one tab
- Open http://astro.localhost in another
- Open http://tanstack.localhost in another
- Open http://angular.localhost in another

All using the **same database**, so you can see how each framework handles the same data!
