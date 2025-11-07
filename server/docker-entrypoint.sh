#!/bin/sh
set -e

echo "🚀 Iniciando TeamWorks Backend..."

# Esperar a que la base de datos esté lista
echo "⏳ Esperando a que la base de datos esté lista..."
max_attempts=30
attempt=0

# Extraer información de conexión de DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

# Si no podemos extraer, usar valores por defecto
DB_HOST=${DB_HOST:-database}
DB_PORT=${DB_PORT:-5432}

while [ $attempt -lt $max_attempts ]; do
  # Intentar conectar usando pg_isready si está disponible, o simplemente esperar
  if command -v pg_isready > /dev/null 2>&1; then
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" > /dev/null 2>&1; then
      echo "✅ Base de datos disponible"
      break
    fi
  else
    # Si pg_isready no está disponible, intentar ejecutar una migración de prueba
    if npx prisma migrate status > /dev/null 2>&1; then
      echo "✅ Base de datos disponible"
      break
    fi
  fi
  
  attempt=$((attempt + 1))
  echo "⏳ Intento $attempt/$max_attempts: Base de datos no disponible, esperando..."
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ Error: No se pudo conectar a la base de datos después de $max_attempts intentos"
  exit 1
fi

# Generar cliente Prisma primero
echo "🔧 Generando cliente Prisma..."
npx prisma generate

# Ejecutar migraciones de Prisma
echo "📦 Ejecutando migraciones de Prisma..."
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  npx prisma migrate deploy || {
    echo "⚠️  Error ejecutando migraciones, intentando db push..."
    npx prisma db push --accept-data-loss --skip-generate
  }
else
  echo "⚠️  No hay migraciones, usando db push para sincronizar el esquema..."
  npx prisma db push --accept-data-loss --skip-generate
fi

# Iniciar el servidor
echo "🎯 Iniciando servidor..."
exec node dist/index.js

