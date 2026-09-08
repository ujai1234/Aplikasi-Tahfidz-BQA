#!/bin/sh

echo "Starting Express API on port 4000..."
cd /app/server
node dist/index.js &
API_PID=$!

echo "Starting Next.js Web on port 3000..."
cd /app/bqa-app
node server.js &
NEXT_PID=$!

# Trap signals for graceful shutdown
trap "echo 'Shutting down...'; kill -TERM $API_PID $NEXT_PID" TERM INT

# Wait for ANY process to exit
wait -n

# If we reach here, one of the processes crashed/exited.
echo "One of the processes exited. Shutting down container..."
kill -TERM $API_PID $NEXT_PID 2>/dev/null
exit 1
