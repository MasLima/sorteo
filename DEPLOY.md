# Deploy - Guía paso a paso

## 1. Backend en Render (gratis, no pide tarjeta)

### 1.1 Crear cuenta
- Ir a https://render.com → Sign up (GitHub)
- Conectar con GitHub
- **Importante:** NO pide tarjeta de crédito para el free tier

### 1.2 Crear Web Service
- Click **New +** → **Web Service**
- Conectar GitHub → seleccionar `MasLima/sorteo`
- En **Settings**:
  - **Name**: `sorteo-api`
  - **Runtime**: `Node`
  - **Root Directory**: `backend/` ← **IMPORTANTE: poner esto**
  - **Build Command**: `npm install && npx prisma generate && npm run build`
  - **Start Command**: `npm start`

### 1.3 Variables de entorno (Environment Variables)
Agregar estas:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:dOusEb4aDNxrEbdq@db.jmrjimmjpsjqzflxdiaq.supabase.co:5432/postgres?schema=public` |
| `JWT_SECRET` | `9095cb380f035b754885f3208d21c201af8d51064fc2effa98a0a8fa57dd38b1` |
| `FRONTEND_URL` | (poner luego de desplegar frontend) |
| `PORT` | `10000` |

TWILIO y CLOUDINARY son opcionales, dejarlos vacíos por ahora.

### 1.4 Deploy
- Click **Create Web Service**
- Esperar ~3-5 minutos
- Render te dará una URL: `https://sorteo-api.onrender.com`

### 1.5 Verificar
```
curl https://sorteo-api.onrender.com/api/health
```

**Nota:** En el free tier de Render, el servicio se duerme a los 15 min sin uso. La primera request tras inactividad tarda ~30s en responder. Para que no se duerma, puedes usar https://uptimerobot.com (gratis, hace ping cada 5 min).

---

## 2. Frontend en Vercel (gratis)

### 2.1 Crear cuenta
- Ir a https://vercel.com → Sign up (GitHub)
- Importar repositorio `MasLima/sorteo`

### 2.2 Configurar
- **Root Directory**: `frontend/` (click en Edit → seleccionar `frontend`)
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 2.3 Variables de entorno
| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://sorteo-api.onrender.com/api` |

### 2.4 Deploy
- Click **Deploy**
- Vercel te dará URL: `https://sorteo.vercel.app`

---

## 3. Actualizar FRONTEND_URL

Volver a Render → Dashboard → sorteo-api → Environment:
- Modificar `FRONTEND_URL` → `https://sorteo.vercel.app`
- Render hace redeploy automático

---

## 4. Probar

Abrir `https://sorteo.vercel.app` en el navegador
- Login: `admin@sorteo.com` / `Admin123!`
- Crear sorteo, registrar tickets, confirmar pagos, asignar ganador
