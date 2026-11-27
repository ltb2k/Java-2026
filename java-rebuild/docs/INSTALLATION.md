# Installation Guide

1. Install Node.js, Docker Desktop and Git.
2. Clone/open the project.
3. Run `docker compose up -d`.
4. Run backend `npm install`, copy `.env.example` to `.env`, then `npm run dev`.
5. Run `npm run create-admin`.
6. Run web-admin `npm install` and `npm run dev`.
7. Login with the generated demo account.
8. Test `http://localhost:5000/`.
9. The dashboard calls PostgreSQL through the Express REST API.

Never commit `.env` or production secrets.
