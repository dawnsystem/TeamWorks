#!/bin/bash

# Script to test connection functionality
echo "🧪 Testing TeamWorks Connection Fixes"
echo ""

SUCCESS=0
FAILED=0

# Test 1: Health endpoint
echo "Test 1: Health endpoint (public, no auth)"
HEALTH=$(curl -s -w "\n%{http_code}" http://localhost:3000/health)
HTTP_CODE=$(echo "$HEALTH" | tail -n1)
BODY=$(echo "$HEALTH" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health endpoint works (HTTP $HTTP_CODE)"
    echo "   Response: $(echo $BODY | jq -c .)"
    ((SUCCESS++))
else
    echo "❌ Health endpoint failed (HTTP $HTTP_CODE)"
    ((FAILED++))
fi
echo ""

# Test 2: Server info endpoint
echo "Test 2: Server info endpoint (public, no auth)"
INFO=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/server-info)
HTTP_CODE=$(echo "$INFO" | tail -n1)
BODY=$(echo "$INFO" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Server info endpoint works (HTTP $HTTP_CODE)"
    echo "   Response: $(echo $BODY | jq -c .)"
    ((SUCCESS++))
else
    echo "❌ Server info endpoint failed (HTTP $HTTP_CODE)"
    ((FAILED++))
fi
echo ""

# Test 3: Protected endpoint (should fail without auth)
echo "Test 3: Protected endpoint (requires auth)"
PROTECTED=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/projects)
HTTP_CODE=$(echo "$PROTECTED" | tail -n1)
BODY=$(echo "$PROTECTED" | head -n-1)

if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Protected endpoint correctly requires auth (HTTP $HTTP_CODE)"
    echo "   Response: $(echo $BODY | jq -c .)"
    ((SUCCESS++))
else
    echo "❌ Protected endpoint should return 401, got HTTP $HTTP_CODE"
    ((FAILED++))
fi
echo ""

# Test 4: CORS headers
echo "Test 4: CORS headers"
CORS=$(curl -s -H "Origin: http://localhost:5173" -I http://localhost:3000/health 2>&1 | grep -i "access-control")

if echo "$CORS" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS headers present"
    echo "$CORS" | sed 's/^/   /'
    ((SUCCESS++))
else
    echo "❌ CORS headers missing"
    ((FAILED++))
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Results: $SUCCESS passed, $FAILED failed"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ All tests passed! Connection fixes are working correctly."
    exit 0
else
    echo "❌ Some tests failed. Check the output above."
    exit 1
fi
