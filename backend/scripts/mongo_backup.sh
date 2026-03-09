#!/usr/bin/env bash
# Simple mongodump wrapper. Requires `mongodump` in PATH.
# Usage: ./mongo_backup.sh /path/to/backupdir

OUT_DIR=${1:-./backups}
mkdir -p "$OUT_DIR"
if [ -z "$MONGO_URI" ]; then
  echo "MONGO_URI not set. Set it in environment or .env file."
  exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEST="$OUT_DIR/mongodump_$TIMESTAMP"
mkdir -p "$DEST"

echo "Backing up MongoDB to $DEST"
mongodump --uri="$MONGO_URI" --archive="$DEST/dump.archive" --gzip

echo "Done"
