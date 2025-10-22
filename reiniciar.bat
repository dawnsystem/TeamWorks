@echo off
chcp 65001 >nul
echo.
echo ┌────────────────────────────────────────────┐
echo │   🔧 REINICIO COMPLETO DEL SISTEMA 🔧      │
echo └────────────────────────────────────────────┘
echo.

echo [1/6] ⏹️  Deteniendo procesos...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul
echo ✅ Procesos detenidos
echo.

echo [2/6] 🧹 Limpiando cache...
cd /d "%~dp0server"
if exist "dist" rmdir /s /q "dist" >nul 2>&1
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache" >nul 2>&1
echo ✅ Cache limpiado
echo.

echo [3/6] 🔨 Compilando servidor...
call npm run build >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR al compilar
    pause
    exit /b 1
)
echo ✅ Servidor compilado
echo.

echo [4/6] 🗄️  Verificando base de datos...
call npx prisma migrate status >nul 2>&1
call npx prisma generate >nul 2>&1
echo ✅ Base de datos lista
echo.

echo [5/6] 🧪 Verificando health...
echo.
echo ┌────────────────────────────────────────────┐
echo │   AHORA INICIA LOS SERVIDORES              │
echo └────────────────────────────────────────────┘
echo.
echo 📌 VENTANA 1 - Backend:
echo    cd "%~dp0server"
echo    npm start
echo.
echo 📌 VENTANA 2 - Frontend:
echo    cd "%~dp0client"
echo    npx yarn dev
echo.
echo ┌────────────────────────────────────────────┐
echo │   DESPUÉS EN EL NAVEGADOR                  │
echo └────────────────────────────────────────────┘
echo.
echo 1️⃣  Abre: http://localhost:5173/
echo 2️⃣  Presiona F12
echo 3️⃣  Ejecuta: localStorage.clear()
echo 4️⃣  Recarga: F5
echo 5️⃣  Haz LOGIN
echo 6️⃣  Prueba el botón 🔔
echo.
pause
