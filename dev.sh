#!/bin/bash

# Script para iniciar backend y frontend simultáneamente en desarrollo

echo "🚀 Iniciando TeamWorks en modo desarrollo..."
echo ""

# Verificar que existan los archivos .env
if [ ! -f "server/.env" ]; then
    echo "❌ Error: No existe server/.env"
    echo "   Crea el archivo con las variables necesarias (ver SETUP.md)"
    exit 1
fi

if [ ! -f "client/.env" ]; then
    echo "❌ Error: No existe client/.env"
    echo "   Crea el archivo con: VITE_API_URL=http://localhost:3000/api"
    exit 1
fi

echo "✓ Archivos de configuración encontrados"
echo ""

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servidores..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Iniciar backend
echo "📡 Iniciando backend en puerto 3000..."
cd server
npm run dev &
BACKEND_PID=$!

# Esperar un poco para que el backend inicie
sleep 3

# Iniciar frontend
echo "🎨 Iniciando frontend en puerto 5173..."
cd ../client
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Servidores iniciados"
echo ""
echo "   Backend:  http://localhost:3000"
echo "   Frontend: http://localhost:5173"
echo ""
echo "   Presiona Ctrl+C para detener"
echo ""

# Esperar a que se terminen los procesos
wait

