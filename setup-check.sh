#!/bin/bash

# OmniCampus Setup Verification Script
# This script checks if your environment is properly configured

echo "🎓 OmniCampus Setup Verification"
echo "================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Found $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} Found v$NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

# Check if node_modules exists
echo -n "Checking dependencies... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${YELLOW}!${NC} Dependencies not installed"
    echo "  Run: npm install"
fi

# Check environment variables
echo ""
echo "Environment Variables:"
echo "---------------------"

if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} .env.local file found"
    
    # Check required variables
    REQUIRED_VARS=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    
    for VAR in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$VAR=" .env.local; then
            VALUE=$(grep "^$VAR=" .env.local | cut -d '=' -f2)
            if [ -z "$VALUE" ] || [ "$VALUE" = "your_"* ]; then
                echo -e "${RED}✗${NC} $VAR is not set or using placeholder"
            else
                echo -e "${GREEN}✓${NC} $VAR is configured"
            fi
        else
            echo -e "${RED}✗${NC} $VAR is missing"
        fi
    done
else
    echo -e "${RED}✗${NC} .env.local file not found"
    echo "  Copy .env.example to .env.local and fill in your values"
fi

# Check TypeScript config
echo ""
echo -n "Checking TypeScript config... "
if [ -f "tsconfig.json" ]; then
    echo -e "${GREEN}✓${NC} Found"
else
    echo -e "${RED}✗${NC} tsconfig.json missing"
fi

# Check Tailwind config
echo -n "Checking Tailwind config... "
if [ -f "tailwind.config.ts" ]; then
    echo -e "${GREEN}✓${NC} Found"
else
    echo -e "${RED}✗${NC} tailwind.config.ts missing"
fi

# Check Supabase migrations
echo ""
echo "Supabase Migrations:"
echo "-------------------"

MIGRATION_DIR="supabase/migrations"
if [ -d "$MIGRATION_DIR" ]; then
    MIGRATION_COUNT=$(ls -1 "$MIGRATION_DIR"/*.sql 2>/dev/null | wc -l)
    echo -e "${GREEN}✓${NC} Found $MIGRATION_COUNT migration files"
    
    ls -1 "$MIGRATION_DIR"/*.sql 2>/dev/null | while read file; do
        echo "  - $(basename $file)"
    done
else
    echo -e "${RED}✗${NC} Migration directory not found"
fi

echo ""
echo "Next Steps:"
echo "----------"
echo "1. If dependencies not installed: npm install"
echo "2. Configure .env.local with your Supabase credentials"
echo "3. Run migrations in Supabase SQL Editor"
echo "4. Start dev server: npm run dev"
echo ""
echo "For detailed setup instructions, see README.md and DEPLOYMENT.md"
echo ""
