@echo off
echo 🚀 Configurando TeamWorks...
echo.

:: Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado. Por favor instala Node.js 18 o superior.
    pause
    exit /b 1
)

echo ✓ Node.js encontrado
node -v

:: Verificar npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm no está instalado.
    pause
    exit /b 1
)

echo ✓ npm encontrado
npm -v
echo.

echo 📦 Instalando dependencias del backend...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias del backend
    pause
    exit /b 1
)

echo.
echo 📦 Instalando dependencias del frontend...
cd ..\client
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias del frontend
    pause
    exit /b 1
)

cd ..
echo.
echo ✅ Dependencias instaladas correctamente
echo.
echo ⚙️  Configuración necesaria:
echo.
echo 1. Crea el archivo server\.env con:
echo    DATABASE_URL="postgresql://postgres:password@localhost:5432/teamworks?schema=public"
echo    JWT_SECRET="tu-secreto-aqui"
echo    GROQ_API_KEY="tu-api-key-aqui"
echo.
echo 2. Crea el archivo client\.env con:
echo    VITE_API_URL=http://localhost:3000/api
echo.
echo 3. Configura la base de datos:
echo    cd server
echo    npm run prisma:generate
echo    npm run prisma:migrate
echo.
echo 4. Inicia la aplicación:
echo    Terminal 1: cd server ^&^& npm run dev
echo    Terminal 2: cd client ^&^& npm run dev
echo.
echo 📖 Lee SETUP.md para instrucciones detalladas
echo.
pause

