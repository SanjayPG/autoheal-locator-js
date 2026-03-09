#!/bin/bash

# AutoHeal Parallel Tests - Quick Run Script
# This script helps you quickly run different parallel test scenarios

echo "🚀 AutoHeal Parallel Tests Runner"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found${NC}"
    echo "Please create a .env file with your GEMINI_API_KEY"
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Select test scenario:"
echo ""
echo "1) 🏃 Run all tests (3 workers in parallel)"
echo "2) 🔒 Run isolated instance tests only"
echo "3) 🔗 Run shared cache tests only"
echo "4) ⚡ Run performance comparison tests"
echo "5) 🐌 Run all tests sequentially (1 worker)"
echo "6) 🚀 Run all tests with 5 workers (stress test)"
echo "7) 🎯 Run with debugging (headed mode)"
echo "8) 📊 Generate HTML report from last run"
echo ""
read -p "Enter choice (1-8): " choice

case $choice in
    1)
        echo -e "${GREEN}Running all parallel tests with 3 workers...${NC}"
        npx playwright test tests/playwright-parallel.spec.ts --workers=3
        ;;
    2)
        echo -e "${GREEN}Running isolated instance tests...${NC}"
        npx playwright test tests/playwright-parallel.spec.ts -g "Isolated Instances" --workers=3
        ;;
    3)
        echo -e "${GREEN}Running shared cache tests...${NC}"
        npx playwright test tests/playwright-parallel.spec.ts -g "Shared File Cache" --workers=3
        ;;
    4)
        echo -e "${GREEN}Running performance comparison tests...${NC}"
        npx playwright test tests/playwright-parallel.spec.ts -g "Performance Tests" --workers=1
        ;;
    5)
        echo -e "${BLUE}Running all tests sequentially (no parallelism)...${NC}"
        npx playwright test tests/playwright-parallel.spec.ts --workers=1
        ;;
    6)
        echo -e "${YELLOW}Running stress test with 5 workers...${NC}"
        echo -e "${YELLOW}⚠️  This may hit API rate limits!${NC}"
        npx playwright test tests/playwright-parallel.spec.ts --workers=5
        ;;
    7)
        echo -e "${BLUE}Running with debugging (headed mode)...${NC}"
        npx playwright test tests/playwright-parallel.spec.ts --headed --workers=1
        ;;
    8)
        echo -e "${GREEN}Opening HTML report...${NC}"
        npx playwright show-report
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Test execution completed!${NC}"
echo ""
echo "Next steps:"
echo "- View HTML report: npx playwright show-report"
echo "- Check cache directory: ls -la ./autoheal-cache-parallel-test"
echo "- View AutoHeal reports: ls -la ./autoheal-reports"
