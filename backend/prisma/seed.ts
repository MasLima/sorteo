import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const permissions = [
    { name: 'user.manage' },
    { name: 'raffle.create' },
    { name: 'raffle.edit' },
    { name: 'raffle.delete' },
    { name: 'raffle.view' },
    { name: 'ticket.register' },
    { name: 'ticket.confirm' },
    { name: 'winner.register' },
    { name: 'notification.send' },
  ];

  const createdPermissions: Record<string, string> = {};
  for (const perm of permissions) {
    const created = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
    createdPermissions[created.name] = created.id;
  }

  const roles = [
    {
      name: 'SUPERADMIN',
      description: 'Acceso total al sistema',
      permissions: Object.keys(createdPermissions),
    },
    {
      name: 'ADMIN',
      description: 'Gestión operativa de sorteos',
      permissions: [
        'raffle.create', 'raffle.edit', 'raffle.view',
        'ticket.register', 'ticket.confirm', 'winner.register',
        'notification.send',
      ],
    },
    {
      name: 'VIEWER',
      description: 'Solo consulta',
      permissions: ['raffle.view'],
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: {
        name: role.name,
        description: role.description,
        permissions: {
          create: role.permissions.map((permName) => ({
            permissionId: createdPermissions[permName],
          })),
        },
      },
    });
  }

  const superadminRole = await prisma.role.findUnique({
    where: { name: 'SUPERADMIN' },
  });

  if (superadminRole) {
    const passwordHash = await bcrypt.hash('Admin123!', 10);
    await prisma.user.upsert({
      where: { email: 'admin@sorteo.com' },
      update: {},
      create: {
        name: 'Administrador',
        email: 'admin@sorteo.com',
        passwordHash,
        phone: '',
        roleId: superadminRole.id,
      },
    });
  }

  console.log('Seed ejecutado correctamente');
  console.log('Usuario admin: admin@sorteo.com / Admin123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
