#!/bin/bash
# Setup script for Carematch Israel

set -e

echo "🚀 Setting up Carematch Israel..."

# Check Python version
python_version=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
required_version="3.11"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python 3.11+ required. Found $python_version"
    exit 1
fi

echo "✅ Python version: $python_version"

# Backend setup
echo "📦 Setting up backend..."
cd carematch_backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Copy env file
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "📝 Created .env file - please edit with your settings"
fi

# Run migrations
alembic upgrade head

cd ..

# Admin setup
echo "📦 Setting up admin panel..."
cd carematch_admin

if [ ! -d "node_modules" ]; then
    npm install
fi

cd ..

echo "✅ Setup complete!"
echo ""
echo "To start development servers:"
echo "  Backend:  cd carematch_backend && source venv/bin/activate && uvicorn main:app --reload"
echo "  Admin:    cd carematch_admin && npm run dev"
echo ""
echo "Or use Docker:"
echo "  docker-compose up -d"