# Deploy - Guía paso a paso

## 1. Backend en Koyeb (gratis, nunca se duerme)

### 1.1 Crear cuenta
- Ir a https://app.koyeb.com → Sign up (GitHub)
- Conectar con GitHub

### 1.2 Crear App
- Click **Create App**
- **GitHub** → seleccionar `MasLima/sorteo`
- En **Builder**: seleccionar **Dockerfile**
- En **Settings**:
  - **App name**: `sorteo-api`
  - **Public port**: 3000

### 1.3 Variables de entorno (Environment variables)
Agregar estas:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:dOusEb4aDNxrEbdq@db.jmrjimmjpsjqzflxdiaq.supabase.co:5432/postgres?schema=public` |
| `JWT_SECRET` | `9095cb380f035b754885f3208d21c201af8d51064fc2effa98a0a8fa57dd38b1` |
| `FRONTEND_URL` | (poner luego de desplegar frontend) |
| `PORT` | `3000` |

TWILIO y CLOUDINARY son opcionales, dejarlos vacíos por ahora.

### 1.4 Deploy
- Click **Create App**
- Esperar ~3-5 minutos
- Koyeb te dará una URL: `https://sorteo-api-[hash].koyeb.app`

### 1.5 Verificar
```
curl https://sorteo-api-[hash].koyeb.app/api/health
```

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
| `VITE_API_URL` | `https://sorteo-api-[hash].koyeb.app/api` |

### 2.4 Deploy
- Click **Deploy**
- Vercel te dará URL: `https://sorteo.vercel.app`

---

## 3. Actualizar FRONTEND_URL

Volver a Koyeb → Settings → Environment variables:
- Modificar `FRONTEND_URL` → `https://sorteo.vercel.app`
- Koyeb hace redeploy automático

---

## 4. Probar

Abrir `https://sorteo.vercel.app` en el navegador
- Login: `admin@sorteo.com` / `Admin123!`
- Crear sorteo, registrar tickets, confirmar pagos, asignar ganador
