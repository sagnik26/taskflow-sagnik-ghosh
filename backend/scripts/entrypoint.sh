#!/bin/sh
set -e
echo "Running database migrations..."
npm run migrate
echo "Starting API..."
exec npx nodemon -L server.js
