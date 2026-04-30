## Peña de apuestas (full-stack)

Manual de usuario: ver `MANUAL_USUARIO.md`.

Stack:
- **Backend**: NestJS + Prisma + PostgreSQL + JWT + cron (`@nestjs/schedule`)
- **Frontend**: Next.js (App Router) + TailwindCSS (v3) + Server Actions
- **Dev infra**: Docker + docker-compose
- **Deploy target**: Vercel (frontend) + Render (backend) + Neon (Postgres)

> Importante (Windows): **npm en Windows suele fallar** ejecutando scripts en rutas que contienen `&`.
> Si tu carpeta tiene `&` en la ruta, usa **Docker** (recomendado) o renómbrala (por ejemplo `tiburones-sirenas`).

### Arranque local (Docker)

Requisitos: Docker Desktop.

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001/api`
- Archivos subidos: `http://localhost:3001/uploads/...`

Seed inicial (automático en Docker):
- 19 usuarios (`admin@pena.local` y `persona01@pena.local` … `persona18@pena.local`)
- Fondo/transactions de ejemplo y apuestas de ejemplo

### Credenciales / Login

Entra en `http://localhost:3000/login` con alguno de los emails del seed.  
No hay password (peña privada), el backend valida:
- **whitelist** `AUTH_EMAIL_WHITELIST` (si está definida)
- y que el email exista en DB (`User`)

### Endpoints principales (backend)

- **Auth**: `POST /api/auth/login`
- **Users**: `GET /api/users`
- **Bets**:
  - `GET /api/bets`
  - `POST /api/bets` (admin, multipart con `file` opcional)
  - `PATCH /api/bets/:id` (admin)
- **Transactions**:
  - `GET /api/transactions`
  - `POST /api/transactions` (admin)
- **Dashboard**: `GET /api/dashboard/summary`

### Notificaciones

Variables:
- Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- Email SMTP: `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` (+ opcionales `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_FROM`)
- Destinatario resumen: `WEEKLY_EMAIL_TO`

Eventos:
- Nueva apuesta creada → Telegram
- Premio registrado (`TransactionType=prize`) → Telegram
- Resumen semanal → Telegram + Email

Cron:
- **Lunes 09:00**: resumen semanal (`0 9 * * 1`)

### Deploy (visión rápida)

#### DB (Neon Postgres)
- Crea un proyecto en Neon.
- Copia `DATABASE_URL` (con SSL). Ponlo como env var en Render.

#### Backend (Render)
- Service type: **Web Service**
- Root directory: `backend`
- Build command:
  - `npm install && npx prisma generate && npm run build`
- Start command:
  - `npx prisma migrate deploy && node dist/main`
- Env vars mínimas:
  - `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`
  - opcional: `AUTH_EMAIL_WHITELIST`, Telegram, Email

#### Frontend (Vercel)
- Root directory: `frontend`
- Env vars:
  - `BACKEND_URL` = `https://TU-BACKEND.onrender.com/api`
  - `NEXT_PUBLIC_BACKEND_PUBLIC_URL` = `https://TU-BACKEND.onrender.com`

