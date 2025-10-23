#!/bin/bash

# Script to verify TeamWorks setup before starting servers
echo "🔍 Verificando configuración de TeamWorks..."
echo ""

ERRORS=0
WARNINGS=0

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    ((ERRORS++))
else
    echo "✅ Node.js: $(node -v)"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    ((ERRORS++))
else
    echo "✅ npm: $(npm -v)"
fi

echo ""
echo "📦 Verificando dependencias..."

# Check server node_modules
if [ ! -d "server/node_modules" ]; then
    echo "❌ Dependencias del servidor no instaladas"
    echo "   Ejecuta: cd server && npm install"
    ((ERRORS++))
else
    echo "✅ Dependencias del servidor instaladas"
fi

# Check client node_modules
if [ ! -d "client/node_modules" ]; then
    echo "❌ Dependencias del cliente no instaladas"
    echo "   Ejecuta: cd client && npm install"
    ((ERRORS++))
else
    echo "✅ Dependencias del cliente instaladas"
fi

echo ""
echo "⚙️  Verificando configuración..."

# Check server .env
if [ ! -f "server/.env" ]; then
    echo "❌ Archivo server/.env no existe"
    echo "   Crea el archivo con:"
    echo "   DATABASE_URL=\"postgresql://postgres:password@localhost:5432/teamworks?schema=public\""
    echo "   JWT_SECRET=\"tu-secreto-seguro-aqui\""
    echo "   PORT=3000"
    ((ERRORS++))
else
    echo "✅ Archivo server/.env existe"
    
    # Check for required variables
    if ! grep -q "DATABASE_URL" server/.env; then
        echo "⚠️  DATABASE_URL no configurado en server/.env"
        ((WARNINGS++))
    fi
    
    if ! grep -q "JWT_SECRET" server/.env; then
        echo "⚠️  JWT_SECRET no configurado en server/.env"
        ((WARNINGS++))
    fi
fi

# Check if server is built
if [ ! -d "server/dist" ]; then
    echo "⚠️  Servidor no compilado"
    echo "   Ejecuta: cd server && npm run build"
    ((WARNINGS++))
else
    echo "✅ Servidor compilado"
fi

# Check Prisma Client
if [ ! -d "server/node_modules/.prisma/client" ] && [ ! -d "server/node_modules/@prisma/client" ]; then
    echo "⚠️  Prisma Client no generado"
    echo "   Ejecuta: cd server && npm run prisma:generate"
    ((WARNINGS++))
else
    echo "✅ Prisma Client generado"
fi

echo ""
echo "🗄️  Verificando PostgreSQL..."

# Check if PostgreSQL is accessible
if command -v pg_isready &> /dev/null; then
    if pg_isready -h localhost -p 5432 &> /dev/null; then
        echo "✅ PostgreSQL está corriendo"
    else
        echo "❌ PostgreSQL no responde en localhost:5432"
        echo "   Inicia PostgreSQL o usa Docker:"
        echo "   docker run --name teamworks-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres"
        ((ERRORS++))
    fi
else
    echo "⚠️  No se puede verificar PostgreSQL (pg_isready no disponible)"
    echo "   Asegúrate de que PostgreSQL esté corriendo en localhost:5432"
    ((WARNINGS++))
fi

# Check if port 3000 is available
if command -v lsof &> /dev/null; then
    if lsof -Pi :3000 -sTCP:LISTEN -t &> /dev/null; then
        echo "⚠️  Puerto 3000 ya está en uso"
        echo "   Si es el servidor anterior, detenlo primero"
        ((WARNINGS++))
    else
        echo "✅ Puerto 3000 disponible"
    fi
elif command -v netstat &> /dev/null; then
    if netstat -tuln 2>/dev/null | grep -q ":3000 "; then
        echo "⚠️  Puerto 3000 ya está en uso"
        ((WARNINGS++))
    else
        echo "✅ Puerto 3000 disponible"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ ¡Todo listo! Puedes iniciar los servidores:"
    echo ""
    echo "   Terminal 1: cd server && npm start"
    echo "   Terminal 2: cd client && npm run dev"
    echo ""
    echo "   O usa: ./dev.sh (Linux/Mac) o dev.bat (Windows)"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  Hay $WARNINGS advertencia(s), pero puedes intentar iniciar"
    echo ""
    echo "   Terminal 1: cd server && npm start"
    echo "   Terminal 2: cd client && npm run dev"
    exit 0
else
    echo "❌ Hay $ERRORS error(es) que debes corregir antes de iniciar"
    echo ""
    echo "   Lee los mensajes arriba y corrige los problemas"
    exit 1
fi
