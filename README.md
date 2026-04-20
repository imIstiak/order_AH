# ShopAdmin Deployment

## Run locally
1. npm install
2. npm run dev

## Build production bundle
1. npm run build
2. npm run preview

## Database migrations
1. Run all pending DB migrations: `npm run db:migrate`
2. Deployment builds now run migrations automatically via `npm run build:deploy`
3. To intentionally bypass migration execution (local-only), set `SKIP_DB_MIGRATIONS=true`

## Database Environment Contract
- `APP_DATABASE_URL`: runtime API/database access for `app_user` only
- `MIGRATION_DATABASE_URL`: migration runner access for `migration_user` only

Runtime API routes fail fast if `APP_DATABASE_URL` is missing. The migration runner fails fast if `MIGRATION_DATABASE_URL` is missing.

### Example `.env` setup
```env
# App runtime credentials (data read/write only)
APP_DATABASE_URL=postgres://app_user:APP_PASSWORD@db-host:5432/shopadmin

# Migration credentials (DDL allowed)
MIGRATION_DATABASE_URL=postgres://migration_user:MIGRATION_PASSWORD@db-host:5432/shopadmin

# Optional local override
SKIP_DB_MIGRATIONS=false
```

## Deploy to Vercel
1. Push this folder to GitHub
2. Import the repository in Vercel
3. Deploy (vercel.json runs `npm run build:deploy`, which applies DB migrations before build)

## Deploy to Netlify
1. Push this folder to GitHub
2. Import the repository in Netlify
3. Build command: npm run build:deploy
4. Publish directory: dist
5. The netlify.toml file already includes SPA redirect config and migration-first build command

## Cloudflare R2 image storage

This project now uploads product images through a serverless API route: `/api/r2-upload`.

### Required environment variables (Vercel Project Settings)
- `APP_DATABASE_URL` (runtime app_user connection string)
- `MIGRATION_DATABASE_URL` (build-time migration_user connection string)
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

### Optional overrides
- `R2_ACCOUNT_ID`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`
- `R2_S3_ENDPOINT` (example: `https://49e3a38a15518a0c0013af2d37fcb319.r2.cloudflarestorage.com`)

Defaults are already set from your provided values.

### Local development upload
Vite local dev does not run the Vercel API route, so set this in `.env.local`:

`VITE_R2_UPLOAD_ENDPOINT=https://shopadmin-live-bd.vercel.app/api/r2-upload`

Then run:
1. npm run dev
2. Upload product photos from the Products page

### Notes
- Max upload size is 8MB per image.
- Product featured photos, variant photos, and description images are uploaded to R2.
