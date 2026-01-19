# 🚀 Quick Reference Card - Docker Deployment

## One-Command Deployment
```bash
make up              # Start all services
# or
docker-compose up -d
```

## Access URLs
| Service | URL | Purpose |
|---------|-----|---------|
| **Flask** | http://flask.localhost | Python + HTMx stack |
| **Astro** | http://astro.localhost | Astro 6 + Svelte 5 stack |
| **TanStack** | http://tanstack.localhost | React 19 + TanStack stack |
| **Angular** | http://angular.localhost | Angular 21 + Signals stack |
| **Traefik** | http://localhost:8080 | Load balancer dashboard |
| **PostgreSQL** | localhost:5432 | Shared database |
| **Redis** | localhost:6379 | Cache & jobs |

## Essential Commands
```bash
make help            # Show all available commands
make ps              # Check service status
make logs            # View all logs (live)
make logs-flask      # Flask logs only
make restart         # Restart all services
make rebuild         # Rebuild all images
make down            # Stop all services
make clean           # Stop and delete volumes ⚠️

# Database
make db-shell        # PostgreSQL shell
make db-reset        # Reset database ⚠️
make backup          # Backup to backup.sql
make restore         # Restore from backup.sql

# Testing
make test            # Load test all stacks
make stats           # Show resource usage

# Browser shortcuts
make open-all        # Open all stacks in browser
make open-flask      # Open Flask only
```

## First-Time Setup
```bash
# 1. Add domains to /etc/hosts
make install-hosts

# 2. Start services
make up

# 3. Wait for services to be healthy (~30s)
make ps

# 4. Open all stacks in browser
make open-all
```

## Troubleshooting
```bash
# Services not starting?
make logs            # Check error messages
make rebuild         # Rebuild images
make down && make up # Clean restart

# Database issues?
make db-shell        # Check DB connection
make db-reset        # Reset database ⚠️

# Port conflicts?
sudo lsof -i :80     # Check who's using port 80
sudo lsof -i :5432   # Check PostgreSQL port
```

## Architecture
```
Client Browser
    ↓
Traefik (Port 80)
    ↓
├─→ Flask (flask.localhost)
├─→ Astro (astro.localhost)
├─→ TanStack (tanstack.localhost)
└─→ Angular (angular.localhost)
    ↓
PostgreSQL (shared database)
    ↓
Redis (Flask only)
```

## Health Checks
All services have automatic health checks:
- **PostgreSQL**: `pg_isready` every 10s
- **Redis**: `redis-cli ping` every 10s
- **Flask**: HTTP check on `/health`
- **Astro**: HTTP check on `/health`
- **TanStack**: HTTP check on `/health`
- **Angular**: HTTP check on `/health`

## Resource Usage (Typical)
| Service | CPU | Memory |
|---------|-----|--------|
| Flask | ~2-5% | ~150MB |
| Astro | ~1-3% | ~120MB |
| TanStack | ~2-4% | ~180MB |
| Angular | ~1-2% | ~100MB |
| PostgreSQL | ~1-3% | ~50MB |
| Redis | ~0.5% | ~10MB |
| Traefik | ~0.5% | ~30MB |
| **Total** | ~8-18% | ~640MB |

## Production Checklist
- [ ] Change `POSTGRES_PASSWORD` in docker-compose.yml
- [ ] Change `SECRET_KEY` in Flask environment
- [ ] Disable Traefik dashboard (`--api.dashboard=false`)
- [ ] Enable HTTPS with Let's Encrypt
- [ ] Set up automatic backups (`make backup` in cron)
- [ ] Configure resource limits in docker-compose.yml
- [ ] Set up monitoring (Prometheus + Grafana)

## Comparison Features
Each stack has the **same features**:
- ✅ User authentication (JWT)
- ✅ Create/like/retweet posts
- ✅ Threaded conversations
- ✅ Real-time notifications (SSE)
- ✅ Infinite scroll
- ✅ Optimistic UI updates
- ✅ Full-text search
- ✅ User profiles
- ✅ Follow/unfollow

**Same database = same data across all stacks!**

## Performance Testing
```bash
# Load test with Apache Bench
ab -n 1000 -c 10 http://flask.localhost/

# Or use the make command
make test

# Monitor resources
make stats
```

## Learn More
- Full guide: [DOCKER.md](DOCKER.md)
- Main README: [README.md](README.md)
- Benchmarks: [ANALYTICS.md](ANALYTICS.md)
- Features: [2026-FEATURES.md](2026-FEATURES.md)

---

**Deployed in seconds, compared side-by-side instantly!** 🚀
