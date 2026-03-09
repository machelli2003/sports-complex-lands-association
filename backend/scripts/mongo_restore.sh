#!/usr/bin/env bash
# Restore from archive produced by mongo_backup.sh
# Usage: ./mongo_restore.sh /path/to/dump.archive

ARCHIVE=${1:-}
if [ -z "$ARCHIVE" ]; then
  echo "Usage: $0 /path/to/dump.archive"
  exit 1
fi

if [ -z "$MONGO_URI" ]; then
  echo "MONGO_URI not set. Set it in environment or .env file."
  exit 1
fi

echo "Restoring $ARCHIVE to $MONGO_URI"
mongorestore --uri="$MONGO_URI" --archive="$ARCHIVE" --gzip --drop

echo "Done"
