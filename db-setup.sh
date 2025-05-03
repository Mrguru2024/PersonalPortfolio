#!/bin/bash

# Run database migration
echo "Running database migration..."
npm run db:push

# Run database seeding
echo "Running database seeding..."
npx tsx server/seed.ts

echo "Database setup completed!"