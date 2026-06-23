-- Ejecutar en Supabase SQL Editor
-- Actualiza la contraseña del admin a: Admin123!

UPDATE "User"
SET "passwordHash" = '$2a$10$FOtITsKudwoqYl7zEABXq.r7HBwNQaYIY3nRe24/x7pXBnvrgtdGe',
    "updatedAt" = NOW()
WHERE email = 'admin@sorteo.com';

-- Si no existe el usuario, lo crea
INSERT INTO "User" (id, name, email, "passwordHash", phone, "isActive", "roleId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  'Administrador',
  'admin@sorteo.com',
  '$2a$10$FOtITsKudwoqYl7zEABXq.r7HBwNQaYIY3nRe24/x7pXBnvrgtdGe',
  '',
  true,
  (SELECT id FROM "Role" WHERE name = 'SUPERADMIN'),
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE email = 'admin@sorteo.com');
