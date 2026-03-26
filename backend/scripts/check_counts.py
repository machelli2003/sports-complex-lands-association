#!/usr/bin/env python3
"""Check collection names and document counts for the target MongoDB database.

Reads the MongoDB URI from `backend.config` or `backend/.env` if available.
If the URI has no default DB, pass `--db DBNAME`.
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Optional
import os


def _load_env_from_backend() -> None:
    """Load key=value pairs from backend/.env into os.environ if not already set."""
    try:
        env_file = Path(__file__).resolve().parents[1] / '.env'
        if not env_file.exists():
            return
        for line in env_file.read_text(encoding='utf8').splitlines():
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            os.environ.setdefault(k, v)
    except Exception:
        pass


_load_env_from_backend()

try:
    from pymongo import MongoClient
except Exception:
    raise SystemExit("pymongo is required. Activate your backend venv and `pip install pymongo`.")

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = REPO_ROOT / "backend"


def read_uri_from_config() -> Optional[str]:
    try:
        import backend.config as cfg
        uri = getattr(cfg.Config, 'MONGO_URI', '') or getattr(cfg.Config, 'MONGODB_HOST', '')
        if uri:
            return uri
    except Exception:
        pass

    env_path = BACKEND_DIR / '.env'
    if env_path.exists():
        text = env_path.read_text(encoding='utf8')
        m = re.search(r'^(?:MONGO_URI|MONGODB_URI|MONGODB_HOST)\s*=\s*(.+)$', text, flags=re.I | re.M)
        if m:
            return m.group(1).strip()

    return None


def get_db(client: MongoClient, dbname: Optional[str]):
    default_db = client.get_default_database()
    if default_db is not None:
        return default_db
    if not dbname:
        raise SystemExit("No default DB in URI and no --db provided. Provide --db to select the database name.")
    return client[dbname]


def main() -> None:
    parser = argparse.ArgumentParser(description='Show collection counts for a MongoDB database')
    parser.add_argument('--uri', help='MongoDB connection URI (overrides config/.env)')
    parser.add_argument('--db', help='Database name (if URI has no default database)')
    args = parser.parse_args()

    uri = args.uri or read_uri_from_config() or os.environ.get('MONGODB_URI') or os.environ.get('MONGO_URI')
    if not uri:
        print('Unable to determine MongoDB URI. Pass --uri or set MONGO_URI in backend/.env or env.')
        raise SystemExit(1)

    client = MongoClient(uri)
    db = get_db(client, args.db)

    cols = db.list_collection_names()
    if not cols:
        print('No collections found in target DB.')
        return

    print(f"Database: {db.name}")
    print('Collection counts:')
    for c in sorted(cols):
        try:
            cnt = db[c].count_documents({})
        except Exception as e:
            cnt = f'error: {e}'
        print(f" - {c}: {cnt}")


if __name__ == '__main__':
    main()
if __name__ == '__main__':
    main()