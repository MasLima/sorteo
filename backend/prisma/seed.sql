-- Seed SQL - Ejecutar en Supabase SQL Editor

-- Permisos
INSERT INTO "Permission" (id, name) VALUES (gen_random_uuid(), 'user.manage') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Permission" (id, name) VALUES (gen_random_uuid(), 'raffle.create') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Permission" (id, name) VALUES (gen_random_uuid(), 'raffle.edit') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Permission" (id, name) VALUES (gen_random_uuid(), 'raffle.delete') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Permission" (id, name) VALUES (gen_random_uuid(), 'raffle.view') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Permission" (id, name) VALUES (gen_random_uuid(), 'ticket.register') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Permission" (id, name) VALUES (gen_random_uuid(), 'ticket.confirm') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Permission" (id, name) VALUES (gen_random_uuid(), 'winner.register') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Permission" (id, name) VALUES (gen_random_uuid(), 'notification.send') ON CONFLICT (name) DO NOTHING;

-- Roles
INSERT INTO "Role" (id, name, description) VALUES (gen_random_uuid(), 'SUPERADMIN', 'Acceso total al sistema') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Role" (id, name, description) VALUES (gen_random_uuid(), 'ADMIN', 'Gestion operativa de sorteos') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Role" (id, name, description) VALUES (gen_random_uuid(), 'VIEWER', 'Solo consulta') ON CONFLICT (name) DO NOTHING;

-- Asignar permisos a roles
DO $$
DECLARE
  r_id UUID;
  p_id UUID;
BEGIN
  -- SUPERADMIN
  r_id := (SELECT id FROM "Role" WHERE name = 'SUPERADMIN');
  p_id := (SELECT id FROM "Permission" WHERE name = 'user.manage');
  INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  p_id := (SELECT id FROM "Permission" WHERE name = 'raffle.create');
  INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  p_id := (SELECT id FROM "Permission" WHERE name = 'raffle.edit');
  INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  p_id := (SELECT id FROM "Permission" WHERE name = 'raffle.delete');
  INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  p_id := (SELECT id FROM "Permission" WHERE name = 'raffle.view');
  INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  p_id := (SELECT id FROM "Permission" WHERE name = 'ticket.register');
  INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  p_id := (SELECT id FROM "Permission" WHERE name = 'ticket.confirm');
  INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  p_id := (SELECT id FROM "Permission" WHERE name = 'winner.register');
  INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  p_id := (SELECT id FROM "Permission" WHERE name = 'notification.send');
  INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  -- ADMIN
  r_id := (SELECT id FROM "Role" WHERE name = 'ADMIN');
  p_id := (SELECT id FROM "Permission" WHERE name = 'raffle.create');
  INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  p_id := (SELECT id FROM "Permission" WHERE name = 'raffle.edit');
  INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  p_id := (SELECT id FROM "Permission" WHERE name = 'raffle.view');
  INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  p_id := (SELECT id FROM "Permission" WHERE name = 'ticket.register');
  INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  p_id := (SELECT id FROM "Permission" WHERE name = 'ticket.confirm');
  INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  p_id := (SELECT id FROM "Permission" WHERE name = 'winner.register');
  INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  p_id := (SELECT id FROM "Permission" WHERE name = 'notification.send');
  INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
  -- VIEWER
  r_id := (SELECT id FROM "Role" WHERE name = 'VIEWER');
  p_id := (SELECT id FROM "Permission" WHERE name = 'raffle.view');
  INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES (r_id, p_id) ON CONFLICT DO NOTHING;
END; $$;

-- Usuario admin
INSERT INTO "User" (id, name, email, "passwordHash", phone, "isActive", "roleId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  'Administrador',
  'admin@sorteo.com',
  '$2a$10$bngbZ/dqadsFcc.viR4eYeCuXKQ0AiWOWbvW4DFc3sR0TiWEBk28C',
  '',
  true,
  (SELECT id FROM "Role" WHERE name = 'SUPERADMIN'),
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE email = 'admin@sorteo.com');
