import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

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
  console.log('Modulos cargados OK');

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/raffles', raffleRoutes);
  app.use('/api/notifications', notificationRoutes);
} catch (err) {
  console.error('ERROR al cargar modulos:', err);
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

export default app;
