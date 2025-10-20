#!/bin/bash

# Script para iniciar backend y frontend simultáneamente en desarrollo

echo "🚀 Iniciando TeamWorks en modo desarrollo..."
echo ""

# Verificar que exista el archivo .env del servidor (requerido para DB y JWT)
if [ ! -f "server/.env" ]; then
    echo "❌ Error: No existe server/.env"
    echo "   Crea el archivo con las variables necesarias (ver SETUP.md o QUICK_START.md)"
    echo "   Mínimo requerido: DATABASE_URL, JWT_SECRET"
    exit 1
fi

# El archivo client/.env ya no es requerido
if [ ! -f "client/.env" ]; then
    echo "ℹ️  Nota: No existe client/.env (es opcional)"
    echo "   La URL del API se puede configurar desde la interfaz de usuario"
    echo ""
fi

echo "✓ Configuración verificada"
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

