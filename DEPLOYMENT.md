Deployment checklist and runbook

1) Prepare environment
- Copy `.env.example` to `.env` and fill `MONGO_URI` and `JWT_SECRET_KEY`.

2) Local quick deploy (Docker Compose)
- Build and start services:

```bash
docker-compose build
docker-compose up -d
```

- Visit `http://localhost/health` to verify.

3) Backups
- Use `backend/scripts/mongo_backup.sh` to create a compressed archive. Example:

```bash
export MONGO_URI="mongodb://user:pass@host:27017/db"
./backend/scripts/mongo_backup.sh ./backups
```

- Restore with `backend/scripts/mongo_restore.sh`.

4) Logs
- App logs are in `backend/logs/app.log` inside the container or on host when mounted.

5) Persistent files
- `backend/instance/uploads` and `backend/instance/receipts` should be placed on persistent storage (NFS, S3 via adapter, or host volume).

6) TLS
- Deploy behind a reverse proxy (NGINX, Traefik) with TLS termination. Example `deploy/nginx.conf` provided.

7) Secrets
- Use a secret manager (AWS Secrets Manager, Azure Key Vault, Vault) to store `MONGO_URI` and `JWT_SECRET_KEY` in production.

8) CI/CD
- Simple GitHub Actions workflow added at `.github/workflows/ci.yml`.

9) Monitoring
- Attach app logs to a central aggregator and monitor the `health` endpoint.

10) Further hardening
- Configure rate-limiting, content security policy, and vulnerability scanning before going live.

## Managed MongoDB (Atlas) notes

- Recommended: create a MongoDB Atlas project and cluster. Use an SRV connection string (starts with `mongodb+srv://`) as your `MONGO_URI`.
- Enable continuous cloud backups in Atlas and configure alerting for disk/memory and slow queries.
- Whitelist your application IP(s) or configure VPC peering for private access.

Example `MONGO_URI` (Atlas):

```
mongodb+srv://<user>:<password>@cluster0.abcdg.mongodb.net/sports_complex?retryWrites=true&w=majority
```

## Monitoring & Error Reporting

- Sentry: set `SENTRY_DSN` in `.env` to enable error aggregation and stack traces. Sentry is initialized automatically if present.
- Prometheus: the app exposes `/metrics` (Prometheus text format). Configure a Prometheus server to scrape `http://<host>:5001/metrics`.
- Prometheus is included in `docker-compose.yml` and exposes a UI on port `9090` when you run the full stack locally.
- Health: use `/health` for simple liveness/readiness checks.

## Automated backups (cloud)

- For Atlas, use Atlas's automated backup features (snapshot/continuous) and configure a retention policy.
- For self-hosted MongoDB, use the provided `backend/scripts/mongo_backup.sh` with a cron job or scheduled task, and copy archives to durable object storage (S3, Blob Storage).

## TLS / Let's Encrypt (example)

You can automate TLS issuance using Certbot together with Nginx. Example approach for Docker Compose:

- Mount a directory for `/etc/letsencrypt` to persist certificates.
- Stop Nginx, run a Certbot container to obtain certificates for your domain, then restart Nginx with the certs mounted.

Example (high level):

```yaml
services:
	nginx:
		image: nginx:stable-alpine
		volumes:
			- ./deploy/nginx.conf:/etc/nginx/conf.d/default.conf:ro
			- ./letsencrypt:/etc/letsencrypt

	certbot:
		image: certbot/certbot
		command: certonly --webroot -w /var/www/certbot -d your.domain.com --email you@example.com --agree-tos --non-interactive
```

You must replace `your.domain.com` and ensure `webroot` path is served by Nginx during validation. Consider using Traefik for fully automated ACME in Docker environments.

## Load / Performance Testing

A k6 script is included at `deploy/k6/test_payment_flow.js`. Example run:

```bash
# install k6 (https://k6.io/docs/getting-started/installation)
k6 run deploy/k6/test_payment_flow.js --env BASE_URL=http://localhost:5001 --vus 10 --duration 1m
```

Set `TEST_CLIENT_ID` and `TEST_STAGE_ID` env vars to exercise the payment creation path fully.

## Terraform Atlas provisioning skeleton

See `deploy/terraform/` for a Terraform skeleton that uses the `mongodbatlas` provider. You must supply Atlas API keys and `org_id`.


