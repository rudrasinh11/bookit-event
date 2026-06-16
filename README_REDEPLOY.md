# BookIT Event

## Frontend Vercel
- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`
- Env: `VITE_API_URL=https://your-backend-domain.vercel.app/api`

## Backend Vercel
- Root Directory: `server`
- Install Command: `npm install`
- Build Command: leave empty or `npm install`
- Node Version: 20.x
- Required env vars:
  - `MONGO_URI`
  - `JWT_SECRET`
  - `JWT_REFRESH_SECRET`
  - `EMAIL_USER`
  - `EMAIL_PASS`

## Local Run
### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```
