#!/bin/bash

# Create a backups directory if it doesn't exist
mkdir -p backups

# Generate a timestamp for the filename
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
# Save the backup in the current directory's backups folder
BACKUP_DIR="$(pwd)/backups"
BACKUP_FILE="${BACKUP_DIR}/irshad_db_backup_${TIMESTAMP}.sql"

echo "Starting database backup using Docker (PostgreSQL 18)..."
echo "This might take a few moments depending on the size of your data."

# Run pg_dump using Docker to match the server's PostgreSQL 18 version
# We mount the local backups folder to /workspace in the container so the file is saved locally
docker run --rm -v "${BACKUP_DIR}:/workspace" postgres:18 \
  pg_dump "postgresql://neondb_owner:npg_u8hqs1ZlpKNS@ep-royal-butterfly-asgx2yna.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require" -F c -f "/workspace/irshad_db_backup_${TIMESTAMP}.sql"

if [ $? -eq 0 ]; then
    echo "✅ Backup successfully created at: $BACKUP_FILE"
else
    echo "❌ Backup failed."
fi
