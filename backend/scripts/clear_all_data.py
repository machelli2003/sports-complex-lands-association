#!/usr/bin/env python3
"""Clear all application data from MongoDB and remove uploaded files.

This script will DROP/DELETE all collections in the target database and
remove files under `backend/instance/receipts`, `backend/instance/uploads`,
and the repo-level `instance/receipts` and `instance/uploads` directories.

It attempts to read the MongoDB URI from the app config or `backend/.env`.
Run with `--yes` to skip interactive confirmation.

IMPORTANT: This is destructive. Make a backup first (e.g. `mongodump`).
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
from pathlib import Path
from typing import Optional

try:
    from pymongo import MongoClient
except Exception:
    raise SystemExit("pymongo is required. Activate your backend venv and `pip install pymongo`.")


REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = REPO_ROOT / "backend"


def read_uri_from_config() -> Optional[str]:
    # ensure .env loaded
    try:
        env_file = Path(__file__).resolve().parents[1] / '.env'
        if env_file.exists():
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

    try:
        # import backend.config.Config which reads env vars
        import backend.config as cfg

        uri = getattr(cfg.Config, 'MONGO_URI', '') or getattr(cfg.Config, 'MONGODB_HOST', '')
        if uri:
            return uri
    except Exception:
        pass

    # fallback: parse backend/.env
    env_path = BACKEND_DIR / '.env'
    if env_path.exists():
        text = env_path.read_text(encoding='utf8')
        m = re.search(r'^(?:MONGO_URI|MONGODB_URI|MONGO_URI|MONGODB_HOST)\s*=\s*(.+)$', text, flags=re.I | re.M)
        if m:
            return m.group(1).strip()

    return None


def get_db(client: MongoClient, dbname: Optional[str]):
    # If the URI contains a default DB use it, otherwise require dbname
    default_db = client.get_default_database()
    if default_db is not None:
        return default_db
    if not dbname:
        raise SystemExit("No default DB in URI and no --db provided. Provide --db to select the database name.")
    return client[dbname]


def clear_collections(db, dry_run: bool = False) -> None:
    cols = db.list_collection_names()
    if not cols:
        print("No collections found in target DB.")
        return

    print("Collections found:")
    for c in cols:
        cnt = db[c].count_documents({})
        print(f" - {c}: {cnt} documents")

    if dry_run:
        print("Dry run complete. No changes made.")
        return

    for c in cols:
        print(f"Dropping collection: {c}")
        db.drop_collection(c)


def clear_files(dirs: list[Path], dry_run: bool = False) -> None:
    for d in dirs:
        if not d.exists():
            print(f"Directory not found, skipping: {d}")
            continue
        # remove all contents but keep dir itself
        items = list(d.iterdir())
        if not items:
            print(f"No files in: {d}")
            continue
        print(f"Clearing {len(items)} items from {d}")
        if dry_run:
            continue
        for it in items:
            if it.is_dir():
                shutil.rmtree(it)
            else:
                it.unlink()


def main() -> None:
    parser = argparse.ArgumentParser(description='Clear all DB collections and uploaded files (destructive).')
    parser.add_argument('--uri', help='MongoDB connection URI (overrides config/.env)')
    parser.add_argument('--db', help='Database name (if URI has no default database)')
    parser.add_argument('--yes', action='store_true', help='Skip confirmation prompt')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be removed without deleting')
    args = parser.parse_args()

    uri = args.uri or read_uri_from_config() or os.environ.get('MONGODB_URI') or os.environ.get('MONGO_URI')
    if not uri:
        print('Unable to determine MongoDB URI. Pass --uri or set MONGO_URI in backend/.env or env.')
        raise SystemExit(1)

    print(f"Using MongoDB URI: {uri.split('@')[-1] if '@' in uri else uri}")

    if not args.yes:
        print('\n*** DESTRUCTIVE ACTION: This will drop ALL collections in the target database and delete uploaded files. ***')
        ok = input('Type YES to proceed: ')
        if ok.strip() != 'YES':
            print('Aborted by user.')
            return

    client = MongoClient(uri)
    db = get_db(client, args.db)

    clear_collections(db, dry_run=args.dry_run)

    # remove upload/receipt dirs both under backend instance and repo instance
    backend_receipts = BACKEND_DIR / 'instance' / 'receipts'
    backend_uploads = BACKEND_DIR / 'instance' / 'uploads'
    repo_receipts = REPO_ROOT / 'instance' / 'receipts'
    repo_uploads = REPO_ROOT / 'instance' / 'uploads'

    dirs = [backend_receipts, backend_uploads, repo_receipts, repo_uploads]
    clear_files(dirs, dry_run=args.dry_run)

    print('\nOperation complete.')


if __name__ == '__main__':
    main()
