import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

dotenv.config();

console.log('Iniciando servidor...');
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'configurada' : 'NO CONFIGURADA');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/ping', (_req, res) => {
  res.send('pong');
});

try {
  console.log('Cargando modulos...');
  const authRoutes = require('./routes/auth.routes').default;
  const userRoutes = require('./routes/user.routes').default;
  const raffleRoutes = require('./routes/raffle.routes').default;
  const notificationRoutes = require('./routes/notification.routes').default;
  const publicRoutes = require('./routes/public.routes').default;
  const roleRoutes = require('./routes/role.routes').default;
  console.log('Modulos cargados OK');

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/roles', roleRoutes);
  app.use('/api/raffles', raffleRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/public', publicRoutes);
} catch (err) {
  console.error('ERROR al cargar modulos:', err);
}

async function ensureAdminUser() {
  try {
    const prisma = new PrismaClient();
    const adminRole = await prisma.role.findUnique({ where: { name: 'SUPERADMIN' } });
    if (!adminRole) {
      console.log('ADVERTENCIA: No existe rol SUPERADMIN - ejecutar seed primero');
      return;
    }
    const hash = await bcrypt.hash('Admin123!', 10);
    const existing = await prisma.user.findUnique({ where: { email: 'admin@sorteo.com' } });
    if (existing) {
      await prisma.user.update({
        where: { email: 'admin@sorteo.com' },
        data: { passwordHash: hash, updatedAt: new Date() },
      });
      console.log('Admin password reset to: Admin123!');
    } else {
      await prisma.user.create({
        data: {
          name: 'Administrador',
          email: 'admin@sorteo.com',
          passwordHash: hash,
          phone: '',
          roleId: adminRole.id,
        },
      });
      console.log('Admin user created: admin@sorteo.com / Admin123!');
    }
    await prisma.$disconnect();
  } catch (err) {
    console.error('Error al verificar admin:', err);
  }
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  ensureAdminUser();
});

export default app;
