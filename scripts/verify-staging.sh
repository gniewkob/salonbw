#!/bin/bash
set -e

echo "Verifying Staging Environment..."

echo "1. Checking Frontend (dev.salon-bw.pl)..."
CODE=$(curl -s -o /dev/null -w "%{http_code}" https://dev.salon-bw.pl)
if [ "$CODE" -eq 200 ]; then
    echo "Frontend OK (200)"
else
    echo "Frontend FAIL ($CODE)"
    exit 1
fi

echo "2. Checking Backend (api.salon-bw.pl)..."
CODE=$(curl -s -o /dev/null -w "%{http_code}" https://api.salon-bw.pl/api/health)
if [ "$CODE" -eq 200 ]; then
    echo "Backend OK (200)"
else
    echo "Backend FAIL ($CODE)"
    exit 1
fi

echo "3. Checking Panel (panel.salon-bw.pl)..."
CODE=$(curl -s -o /dev/null -w "%{http_code}" https://panel.salon-bw.pl)
if [ "$CODE" -eq 200 ]; then
    echo "Panel OK (200)"
else
    echo "Panel FAIL ($CODE)"
    exit 1
fi

echo "4. Content Check (Register Page)..."
# Check if we can fetch register page
curl -s https://dev.salon-bw.pl/auth/register | grep -q "<html" && echo "Register Page HTML OK" || echo "Register Page FAIL"

echo "Staging Verification Complete."
exit 0
