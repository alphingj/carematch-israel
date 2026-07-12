# Carematch Israel - Modular Python Backend

A modular, plugin-based backend for the Carematch Israel caregiver job matching platform. Built with FastAPI, SQLAlchemy, and a React admin panel.

## Architecture Overview

```
carematch_backend/
├── main.py                 # FastAPI application entry point
├── core/                   # Core infrastructure
│   ├── config.py          # Pydantic Settings configuration
│   ├── database.py        # Async SQLAlchemy setup
│   ├── security.py        # JWT, password hashing
│   └── exceptions.py      # Custom exceptions
├── modules/               # Plugin system
│   ├── base.py            # Base module classes
│   ├── loader.py          # Module discovery & registry
│   ├── auth/              # Core authentication
│   ├── users/             # User management
│   ├── jobs/              # Job postings
│   ├── admin/             # Admin dashboard
│   ├── notifications/     # Multi-channel notifications
│   ├── matching/          # Caregiver-resident matching
│   └── reporting/         # Analytics & reports
├── api/                   # API routes
│   ├── deps.py           # FastAPI dependencies
│   ├── auth.py           # Authentication endpoints
│   ├── users.py          # User management
│   ├── jobs.py           # Job management
│   ├── modules.py        # Module management
│   └── admin.py          # Admin endpoints
├── models/               # SQLAlchemy models
├── schemas/              # Pydantic schemas
└── tests/                # Test suite
```

## Key Features

### Modular Plugin System
- **Auto-discovery**: Scans `modules/` directory at startup
- **Fault isolation**: Module failures don't crash the app
- **Hot reload**: Reload modules without restart (dev mode)
- **Per-user/role enable**: Enable modules for specific users or roles
- **Health checks**: Each module exposes health endpoint

### Module Management (Admin Panel)
- List all discovered modules with status
- Enable/disable globally
- Enable for specific users
- Enable for specific roles
- Configure module settings
- View module health
- Reload modules

### Core Modules Included
| Module | Category | Description |
|--------|----------|-------------|
| `auth` | Core | JWT authentication, password hashing |
| `users` | Users | Profiles, onboarding, roles |
| `jobs` | Jobs | Job CRUD, search, filters |
| `admin` | Admin | Dashboard, user management, audit logs |
| `notifications` | Notifications | Email, push, in-app |
| `matching` | Caregiver Tools | AI-powered matching algorithm |
| `reporting` | Reporting | Analytics, exports |

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+ (for admin panel)
- PostgreSQL 14+ (or SQLite for dev)

### Quick Start

```bash
# Run setup script
./setup.sh

# Or manually:
cd carematch_backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
alembic upgrade head
uvicorn main:app --reload
```

### Admin Panel
```bash
cd carematch_admin
npm install
npm run dev
# Access at http://localhost:3001
```

### Docker
```bash
docker-compose up -d
```

## Configuration

Key environment variables (`.env`):

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/carematch

# Security
SECRET_KEY=your-32-char-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Module System
MODULES_DIR=modules
MODULE_AUTO_DISCOVER=true
MODULE_HOT_RELOAD=true

# Admin
ADMIN_EMAILS=admin@example.com
```

## Module Development

### Creating a New Module

1. Create directory: `modules/my_module/`
2. Create `module.py`:

```python
from modules.base import BaseModule, ModuleMetadata, ModuleCategory

class MyModule(BaseModule):
    @property
    def metadata(self) -> ModuleMetadata:
        return ModuleMetadata(
            name="my_module",
            version="1.0.0",
            description="My custom module",
            category=ModuleCategory.CUSTOM,
            icon="puzzle",
        )

    async def initialize(self, app, db):
        # Register routes, setup resources
        self.state.routes = [my_router]
        self.state.status = ModuleStatus.LOADED

    async def shutdown(self):
        # Cleanup
        pass

    async def health_check(self):
        return {"status": "healthy", "module": "my_module"}

module = MyModule()
```

3. Restart or use admin panel to discover/load

### Module Configuration

Modules can define config schema:

```python
config_schema = {
    "type": "object",
    "properties": {
        "api_key": {"type": "string"},
        "max_results": {"type": "integer", "default": 10},
    }
}
```

Admin panel provides UI for configuration.

## API Documentation

- **Swagger UI**: `/docs`
- **ReDoc**: `/redoc`
- **OpenAPI**: `/openapi.json`

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/refresh` | Refresh token |
| GET | `/api/v1/users` | List users (admin) |
| GET | `/api/v1/jobs` | List jobs |
| GET | `/api/v1/modules` | List modules (admin) |
| POST | `/api/v1/modules/{name}/enable` | Enable module |
| GET | `/api/v1/admin/stats` | Admin dashboard stats |

## Testing

```bash
cd carematch_backend
pytest tests/ -v --cov
```

## Project Structure Decisions

### Why Plugin System over Microservices?
- **Zero network latency** between modules
- **Single deployment unit** - simpler ops
- **Shared database transactions** - ACID across modules
- **Hot reload** without container restarts

### Why FastAPI?
- **Async native** - high concurrency
- **Auto OpenAPI** - docs always in sync
- **Pydantic validation** - type-safe requests/responses
- **Dependency injection** - clean architecture

### Database Choice
- **PostgreSQL** for production (JSONB, performance)
- **SQLite** for development (zero config)

## Security

- JWT with refresh token rotation
- Bcrypt password hashing (12 rounds)
- Role-based access control (RBAC)
- Module-level permission system
- Audit logging for admin actions
- CORS configured per environment

## Monitoring

- Prometheus metrics at `/metrics`
- Structured JSON logging
- Health check endpoints (`/health`, `/health/ready`, `/health/live`)

## License

MIT License - see LICENSE file for details.