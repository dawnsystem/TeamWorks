@echo off
echo 🚀 Iniciando TeamWorks en modo desarrollo...
echo.

:: Verificar archivo .env del servidor (requerido)
if not exist "server\.env" (
    echo ❌ Error: No existe server\.env
    echo    Crea el archivo con las variables necesarias (ver SETUP.md o QUICK_START.md)
    echo    Mínimo requerido: DATABASE_URL, JWT_SECRET
    pause
    exit /b 1
)

:: El archivo client/.env ya no es requerido
if not exist "client\.env" (
    echo ℹ️  Nota: No existe client\.env (es opcional)
    echo    La URL del API se puede configurar desde la interfaz de usuario
    echo.
)

echo ✓ Configuración verificada
echo.
echo 📡 Iniciando backend en puerto 3000...
echo 🎨 Iniciando frontend en puerto 5173...
echo.
echo ✅ Abriendo dos ventanas de terminal...
echo.
echo    Backend:  http://localhost:3000
echo    Frontend: http://localhost:5173
echo.
echo    Cierra las ventanas para detener los servidores
echo.

:: Abrir backend en nueva ventana
start "TeamWorks Backend" cmd /k "cd server && npm run dev"

:: Esperar un poco
timeout /t 3 /nobreak >nul

:: Abrir frontend en nueva ventana
start "TeamWorks Frontend" cmd /k "cd client && npm run dev"

echo.
echo Presiona cualquier tecla para cerrar esta ventana (los servidores seguirán corriendo)...
pause >nul

