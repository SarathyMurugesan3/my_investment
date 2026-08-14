#!/bin/bash
# Keep-alive health ping script for Render
# Usage: BACKEND_URL=https://your-service.onrender.com ./keep-alive.sh

if [ -z "$BACKEND_URL" ]; then
    echo "Error: BACKEND_URL environment variable is not set."
    echo "Usage: BACKEND_URL=http://localhost:8080 ./keep-alive.sh"
    exit 1
fi

TARGET="$BACKEND_URL/api/health"
echo "Pinging health endpoint: $TARGET"

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" --max-time 10 "$TARGET")
CURL_STATUS=$?

if [ $CURL_STATUS -ne 0 ]; then
    echo "Curl failed with status code $CURL_STATUS"
    exit 1
fi

HTTP_BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\r' | grep "HTTP_STATUS:" | cut -d':' -f2)

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "Status: Success (200)"
    echo "Response: $HTTP_BODY"
    exit 0
else
    echo "Status: Failed ($HTTP_STATUS)"
    echo "Response: $HTTP_BODY"
    exit 1
fi
