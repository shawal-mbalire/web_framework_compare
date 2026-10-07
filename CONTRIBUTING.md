# Contributing to Full-Stack Framework Comparison

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a welcoming environment
- Report inappropriate behavior to maintainers

## Getting Started

### Prerequisites

1. **Install required tools**:
   ```bash
   # PostgreSQL
   sudo apt install postgresql-15
   
   # Bun (for TypeScript stacks)
   curl -fsSL https://bun.sh/install | bash
   
   # uv (for Python)
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/web_framework_compare.git
   cd web_framework_compare
   ```

3. **Set up the database**:
   ```bash
   createdb social_audit
   psql social_audit < schema.sql
   ```

4. **Install dependencies for the stack you're working on**:
   ```bash
   # Flask
   cd flask-stack
   uv venv && source .venv/bin/activate
   uv pip install -e ".[dev]"
   
   # TypeScript stacks (Astro/TanStack/Angular)
   cd astro-stack  # or tanstack-stack or angular-stack
   bun install
   ```

## Development Workflow

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/improvements

### Commit Message Format

Follow conventional commits:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Example**:
```
feat(flask): add user profile endpoint

Implemented GET /api/users/:id endpoint with SQLAlchemy.
Returns user profile with follower count.

Closes #123
```

## Code Standards

### Python (Flask Stack)

**Style Guide**: PEP 8 + Ruff

```bash
# Format code
ruff format app/

# Lint code
ruff check app/

# Type check
mypy app/ --strict
```

**Standards**:
- Use type hints for all function signatures
- Maximum line length: 100 characters
- Use Pydantic for data validation
- Follow SQLAlchemy 2.0 patterns
- Write docstrings for public functions

**Example**:
```python
from typing import Optional
from pydantic import BaseModel

class UserSchema(BaseModel):
    """User profile schema."""
    username: str
    email: str
    bio: Optional[str] = None

def get_user_by_id(user_id: int) -> Optional[UserSchema]:
    """Fetch user by ID from database.
    
    Args:
        user_id: The user's database ID
        
    Returns:
        User profile or None if not found
    """
    # Implementation
    pass
```

### TypeScript (Astro/TanStack/Angular)

**Style Guide**: ESLint + Prettier

```bash
# Format code
bun run format

# Lint code
bun run lint

# Type check
bun run type-check
```

**Standards**:
- Use TypeScript strict mode
- Prefer `const` over `let`
- Use async/await over promises
- Write JSDoc for exported functions
- Component names use PascalCase

**Example**:
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  bio?: string;
}

/**
 * Fetches a user by their ID
 * @param userId - The user's database ID
 * @returns User profile or null if not found
 */
async function getUserById(userId: number): Promise<User | null> {
  // Implementation
}
```

### Database Migrations

- Always include both `up` and `down` migrations
- Test migrations before submitting PR
- Document breaking changes
- Update `schema.sql` to reflect changes

### Docker

- Keep Dockerfiles minimal and optimized
- Use multi-stage builds
- Update `.dockerignore` files appropriately
- Test builds locally before pushing

## Pull Request Process

### Before Submitting

1. **Update your branch**:
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Run tests**:
   ```bash
   # Flask
   pytest --cov=app
   
   # TypeScript (no unit tests yet: type-check + production build)
   bun run type-check && bun run build

   # Everything at once, from the repo root
   make check
   ```

3. **Run linters**:
   ```bash
   # Flask
   ruff check app tests
   ruff format --check app tests
   mypy app
   
   # TypeScript
   bun run lint
   bun run type-check
   ```

4. **Test Docker build** (if applicable):
   ```bash
   docker compose build
   docker compose up -d
   ```

### PR Template

**Title**: Clear, concise description of changes

**Description**:
```markdown
## What does this PR do?
Brief description of the changes

## Why is this needed?
Context for the changes

## How was this tested?
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Docker build successful

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Commit messages follow convention
```

### Review Process

1. At least one maintainer approval required
2. All CI checks must pass
3. No merge conflicts
4. Code review comments addressed

## Testing Requirements

### Unit Tests

**Flask**:
```python
# tests/test_users.py
import pytest
from app.models import User

def test_create_user():
    """Test user creation."""
    user = User(username="testuser", email="test@example.com")
    assert user.username == "testuser"
```

**TypeScript**:
```typescript
// tests/users.test.ts
import { describe, it, expect } from 'vitest';
import { getUserById } from '../lib/users';

describe('getUserById', () => {
  it('should return user when found', async () => {
    const user = await getUserById(1);
    expect(user).toBeDefined();
    expect(user?.username).toBe('testuser');
  });
});
```

### Coverage Requirements

- Aim for 80%+ code coverage
- Critical paths must be tested
- Edge cases should be covered

### Integration Tests

Test API endpoints end-to-end:

```python
def test_user_api(client):
    """Test user API endpoint."""
    response = client.get('/api/users/1')
    assert response.status_code == 200
    assert response.json['username'] == 'testuser'
```

## Documentation

### When to Update Documentation

- Adding new features
- Changing APIs
- Updating dependencies
- Modifying deployment process

### Documentation Standards

- Use clear, concise language
- Include code examples
- Update README if needed
- Add inline comments for complex logic

## Questions?

- Open an issue for discussion
- Join our Discord/Slack (if applicable)
- Email maintainers

## Recognition

Contributors will be acknowledged in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing! 🎉
