#!/bin/bash

# Script de configuración para TeamWorks
echo "🚀 Configurando TeamWorks..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado. Por favor instala Node.js 18 o superior.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js encontrado: $(node -v)${NC}"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm no está instalado.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm encontrado: $(npm -v)${NC}"

# Verificar PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠ PostgreSQL no está instalado en el sistema.${NC}"
    echo -e "${YELLOW}  Puedes usar Docker: docker run --name teamworks-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres${NC}"
fi

echo ""
echo "📦 Instalando dependencias del backend..."
cd server
npm install

echo ""
echo "📦 Instalando dependencias del frontend..."
cd ../client
npm install

echo ""
echo -e "${GREEN}✅ Dependencias instaladas correctamente${NC}"
echo ""
echo -e "${YELLOW}⚙️  Configuración necesaria:${NC}"
echo ""
echo "1. Crea el archivo server/.env con:"
echo "   DATABASE_URL=\"postgresql://postgres:password@localhost:5432/teamworks?schema=public\""
echo "   JWT_SECRET=\"tu-secreto-aqui\""
echo "   GROQ_API_KEY=\"tu-api-key-aqui\""
echo ""
echo "2. Crea el archivo client/.env con:"
echo "   VITE_API_URL=http://localhost:3000/api"
echo ""
echo "3. Configura la base de datos:"
echo "   cd server"
echo "   npm run prisma:generate"
echo "   npm run prisma:migrate"
echo ""
echo "4. Inicia la aplicación:"
echo "   Terminal 1: cd server && npm run dev"
echo "   Terminal 2: cd client && npm run dev"
echo ""
echo -e "${GREEN}📖 Lee SETUP.md para instrucciones detalladas${NC}"

