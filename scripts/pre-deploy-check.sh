#!/bin/bash

# Pre-deployment Security Check Script
# Run this before pushing to GitHub or deploying to production

set -e

echo "🔍 AI Pulse - Pre-Deployment Security Check"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to print error
error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ERRORS=$((ERRORS+1))
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    WARNINGS=$((WARNINGS+1))
}

# Function to print success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo "1️⃣  Checking for sensitive files..."
if [ -f ".env" ]; then
    if git ls-files --error-unmatch .env 2>/dev/null; then
        error ".env file is tracked by Git! Run: git rm --cached .env"
    else
        success ".env exists but is properly ignored"
    fi
else
    warning ".env file not found (OK for CI/CD, but needed for local dev)"
fi

if [ ! -f ".env.example" ]; then
    error ".env.example is missing!"
else
    success ".env.example exists"
fi

echo ""
echo "2️⃣  Checking .gitignore configuration..."
if grep -q "^\.env$" .gitignore || grep -q "^\.env\*$" .gitignore; then
    success ".env is in .gitignore"
else
    error ".env is NOT in .gitignore!"
fi

if grep -q "^!\.env\.example$" .gitignore; then
    success ".env.example is allowed in git"
fi

echo ""
echo "3️⃣  Searching for hardcoded API keys..."
if grep -r "AIzaSy" src/ api/ --exclude-dir=node_modules --exclude="*.sh" 2>/dev/null; then
    error "Found potential hardcoded Gemini API keys!"
else
    success "No hardcoded Gemini API keys found"
fi

echo ""
echo "4️⃣  Checking for API keys in .env.example..."
if grep -E "AIzaSy|sk-|AKIA" .env.example 2>/dev/null; then
    error "Real API keys found in .env.example!"
else
    success ".env.example has placeholder values only"
fi

echo ""
echo "5️⃣  Checking for exposed secrets in code..."
PATTERNS=("password.*=.*['\"]" "secret.*=.*['\"]" "token.*=.*['\"]")
for pattern in "${PATTERNS[@]}"; do
    if grep -riE "$pattern" src/ --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules 2>/dev/null | grep -v "process.env" | grep -v "//"; then
        warning "Found potential hardcoded secrets (pattern: $pattern)"
    fi
done
success "Secret patterns check complete"

echo ""
echo "6️⃣  Checking environment variable usage..."
if grep -r "process.env" src/ --include="*.ts" --include="*.tsx" | grep -v "GEMINI_API_KEY" | grep -v "VITE_" | grep -v "NODE_ENV"; then
    warning "Found non-standard environment variables (might be OK)"
fi
success "Environment variable check complete"

echo ""
echo "7️⃣  Checking for console.log with sensitive data..."
if grep -r "console.log.*apiKey\|console.log.*API_KEY\|console.log.*secret\|console.log.*password" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    warning "Found console.log with potentially sensitive data"
else
    success "No sensitive console.log statements found"
fi

echo ""
echo "8️⃣  Verifying build can complete..."
if npm run build > /dev/null 2>&1; then
    success "Production build succeeds"
else
    error "Production build failed! Run 'npm run build' to see errors"
fi

echo ""
echo "9️⃣  Checking TypeScript types..."
if npm run lint > /dev/null 2>&1; then
    success "TypeScript type check passes"
else
    warning "TypeScript has type errors. Run 'npm run lint' to see details"
fi

echo ""
echo "🔟 Checking git status..."
if git diff --quiet HEAD 2>/dev/null; then
    success "No uncommitted changes"
else
    warning "You have uncommitted changes"
fi

if git diff --cached --quiet 2>/dev/null; then
    success "No staged changes"
else
    echo -e "${YELLOW}ℹ️  You have staged changes. Review with: git diff --cached${NC}"
fi

echo ""
echo "=============================================="
echo "📊 Security Check Summary"
echo "=============================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Safe to deploy.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found. Review and proceed with caution.${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s) and $WARNINGS warning(s) found.${NC}"
    echo -e "${RED}   Please fix errors before deploying!${NC}"
    exit 1
fi
