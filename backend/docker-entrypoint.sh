#!/bin/sh
set -e

echo "Running prisma migrate deploy..."
npx prisma migrate deploy

if [ "${RUN_SEED}" = "true" ]; then
  echo "Seeding database..."
  npx prisma db seed
fi

echo "Starting backend..."
node dist/main

