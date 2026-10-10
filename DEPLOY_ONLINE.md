# Deploy Mushroom IoT for team access (Render + Vercel)

This repository is prepared for deployment, but public URLs are created only after you deploy from your own Render/Vercel accounts. The deployment is not live just because this ZIP exists.

## 1. PostgreSQL on Render

1. Create a PostgreSQL instance in Render.
2. Keep its Internal Database URL private; use it in the backend service in the same Render region.
3. Open the database's SQL shell or connect with a PostgreSQL client and run `database/schema.sql`, then `database/seed.sql` in that order. Do not use the local Docker URL for the online database.

## 2. Backend on Render

Create a **Web Service** from this Git repository:
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

Set these Environment Variables in Render:
- `DATABASE_URL`: Internal Database URL from Render Postgres
- `JWT_SECRET`: a long random secret, unique to production
- `CORS_ORIGIN`: exact Vercel site origin, e.g. `https://your-project.vercel.app` (fill in after deploying the frontend)
- `NODE_ENV`: `production`

Render sets `PORT` automatically. After deployment, verify `https://YOUR-BACKEND.onrender.com/api/health` returns `status: OK` and `database: connected`.

## 3. Create the shared admin account

The same admin account can be used by the team, but its password must be set privately. In the Render backend service environment, set:
- `ADMIN_EMAIL`: shared admin email
- `ADMIN_FULL_NAME`: display name
- `ADMIN_PASSWORD`: strong password of at least 12 characters

Then run the one-time command `npm run seed:admin` against the **online database**. Run it from a shell/job with the same environment variables and `DATABASE_URL` as the service. Do not add `ADMIN_PASSWORD` to Git or send it in chat. This script creates/resets only the configured admin account. New public registrations remain `CUSTOMER`; never change the registration endpoint to accept a role from the client.

## 4. Frontend on Vercel

Create a Vercel project from this same repository:
- Root Directory: `web-admin`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

Set `VITE_API_URL` to `https://YOUR-BACKEND.onrender.com/api`, then redeploy. Vite variables are embedded during build. Set backend `CORS_ORIGIN` to the exact Vercel URL and redeploy backend after the frontend URL is known.

## 5. Verify team login

1. Visit the public Vercel URL from a second device/network.
2. Log in with the shared admin email/password created above.
3. Confirm `/api/health` works and that the frontend requests use the public backend URL, not `localhost`.
4. Test registration separately; new accounts must remain `CUSTOMER`.

## Security and free-tier notes

- Never commit `.env`, database URLs, passwords, or JWT secrets. Rotate any credential that has already been published.
- A shared admin account makes actions hard to attribute and gives everyone who knows the password full privileges; use only if the team explicitly accepts this risk.
- Free hosting plans may sleep, expire, or have limits. Back up data and review current provider terms.
- Deployment requires completing the dashboard setup in your own accounts; this file cannot create services on your behalf.
