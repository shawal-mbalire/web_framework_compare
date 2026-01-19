# Installation & Setup Guide

Complete installation instructions for all four stacks.

---

## Prerequisites

### Required Software

#### For Python (Flask Stack)
```bash
# Python 3.12+
sudo apt install python3.12 python3.12-venv

# uv (Rust-powered package manager - 10-100x faster!)
curl -LsSf https://astral.sh/uv/install.sh | sh

# PostgreSQL 15+
sudo apt install postgresql-15 postgresql-client-15

# Redis (for background jobs)
sudo apt install redis-server
```

#### For TypeScript (All Other Stacks)
```bash
# Bun (faster than Node.js!)
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version  # Should be 1.0+
```

---

## Database Setup

### 1. Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-15 postgresql-contrib

# macOS
brew install postgresql@15

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql@15  # macOS
```

### 2. Create Database
```bash
# Create database user
sudo -u postgres createuser -s $USER

# Create database
createdb social_audit

# Verify connection
psql social_audit -c "SELECT version();"
```

### 3. Load Schema
```bash
# From project root
psql social_audit < schema.sql

# Verify tables were created
psql social_audit -c "\dt"
# Should show: users, posts, follows, likes, notifications, sessions, bookmarks
```

---

## Stack-Specific Setup

### Flask Stack (Python + uv + Ruff)

#### 1. Install Dependencies
```bash
cd flask-stack

# Create virtual environment
uv venv

# Activate virtual environment
source .venv/bin/activate  # Linux/macOS
.venv\Scripts\activate     # Windows

# Install dependencies with uv (10-100x faster than pip!)
uv pip install -e ".[dev]"
```

#### 2. Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Required .env variables:**
```env
DATABASE_URL=postgresql://localhost/social_audit
SECRET_KEY=your-secret-key-here
REDIS_URL=redis://localhost:6379/0
FLASK_ENV=development
```

#### 3. Run Development Server
```bash
# Start Flask dev server
flask --app app run --debug

# Or with Gunicorn (production-like)
gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"
```

**Access**: http://localhost:5000

#### 4. Run Tests
```bash
# Run tests with pytest
pytest

# With coverage
pytest --cov=app

# Type checking
mypy app/ --strict

# Linting with Ruff (Rust-based, super fast!)
ruff check app/

# Formatting with Ruff
ruff format app/
```

---

### Astro Stack (TypeScript + Astro 6 + Bun)

#### 1. Install Dependencies
```bash
cd astro-stack

# Install with Bun (faster than npm!)
bun install
```

#### 2. Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env
nano .env
```

**Required .env variables:**
```env
DATABASE_URL=postgresql://localhost/social_audit
PUBLIC_API_URL=http://localhost:4321
```

#### 3. Run Development Server
```bash
# Start Astro dev server
bun run dev

# With custom port
bun run dev -- --port 3000
```

**Access**: http://localhost:4321

#### 4. Build for Production
```bash
# Build static site
bun run build

# Preview production build
bun run preview
```

#### 5. Run Tests
```bash
# Type checking
bun run astro check

# Unit tests (if configured)
bun run test

# E2E tests (if configured)
bun run test:e2e
```

---

### TanStack Start Stack (React 19 + Bun)

#### 1. Install Dependencies
```bash
cd tanstack-stack

# Install with Bun
bun install
```

#### 2. Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env
nano .env
```

**Required .env variables:**
```env
DATABASE_URL=postgresql://localhost/social_audit
VITE_API_URL=http://localhost:3000
```

#### 3. Run Development Server
```bash
# Start dev server
bun run dev

# With custom port
bun run dev -- --port 4000
```

**Access**: http://localhost:3000

#### 4. Build for Production
```bash
# Build for production
bun run build

# Start production server
bun run start
```

#### 5. Run Tests
```bash
# Type checking
bun run type-check

# Linting
bun run lint

# Unit tests (if configured)
bun run test

# E2E tests (if configured)
bun run test:e2e
```

---

### Angular Stack (Angular 21 + Signals + Zoneless)

#### 1. Install Dependencies
```bash
cd angular-stack

# Install with Bun
bun install
```

#### 2. Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env
nano .env
```

**Required .env variables:**
```env
DATABASE_URL=postgresql://localhost/social_audit
API_URL=http://localhost:4200
```

#### 3. Run Development Server
```bash
# Start Angular dev server
bun run start

# With custom port
bun run ng serve --port 5000
```

**Access**: http://localhost:4200

#### 4. Build for Production
```bash
# Build for production
bun run build

# The output will be in dist/social-audit-angular/
```

#### 5. Run Tests
```bash
# Unit tests
bun run test

# Linting
bun run lint

# E2E tests (if configured)
bun run e2e
```

---

## Docker Setup (Optional)

### Using Docker Compose
```bash
# From project root
docker-compose up

# This will start:
# - PostgreSQL container
# - Redis container
# - All four application stacks
```

**Coming soon** - Docker Compose configuration file

---

## Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U $USER -d social_audit -c "SELECT 1;"

# Reset database (CAUTION: Deletes all data!)
dropdb social_audit && createdb social_audit
psql social_audit < schema.sql
```

### Port Already in Use
```bash
# Find process using port 5000 (example)
lsof -i :5000

# Kill process
kill -9 <PID>
```

### uv Installation Issues
```bash
# Verify uv is installed
uv --version

# Reinstall if needed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Add to PATH (if needed)
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Bun Installation Issues
```bash
# Verify Bun is installed
bun --version

# Reinstall if needed
curl -fsSL https://bun.sh/install | bash

# Add to PATH (if needed)
echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

---

## Performance Tips

### Flask
- Use Gunicorn with multiple workers in production
- Enable Redis caching for frequently accessed data
- Use async routes for I/O-heavy operations

### Astro
- Enable image optimization in astro.config.mjs
- Use `client:idle` for non-critical islands
- Enable compression in production

### TanStack Start
- Use React Compiler for automatic memoization
- Enable streaming for faster TTFB
- Use code splitting for large routes

### Angular
- Keep Zoneless mode enabled for better performance
- Use lazy loading for feature modules
- Enable production mode and AOT compilation

---

## Next Steps

1. ✅ Setup database
2. ✅ Choose a stack to start with
3. ✅ Follow stack-specific installation
4. ✅ Run development server
5. ✅ Create a user account
6. ✅ Start posting!

For detailed feature documentation, see:
- **Flask**: [flask-stack/README.md](flask-stack/README.md)
- **Astro**: [astro-stack/README.md](astro-stack/README.md)
- **TanStack**: [tanstack-stack/README.md](tanstack-stack/README.md)
- **Angular**: [angular-stack/README.md](angular-stack/README.md)

---

**Need help?** Open an issue on GitHub or consult the stack-specific READMEs.
