@echo off
setlocal enabledelayedexpansion

REM Script to verify TeamWorks setup before starting servers
echo 🔍 Verificando configuración de TeamWorks...
echo.

set ERRORS=0
set WARNINGS=0

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js no está instalado
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo ✅ Node.js: !NODE_VERSION!
)

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm no está instalado
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
    echo ✅ npm: !NPM_VERSION!
)

echo.
echo 📦 Verificando dependencias...

REM Check server node_modules
if not exist "server\node_modules" (
    echo ❌ Dependencias del servidor no instaladas
    echo    Ejecuta: cd server ^&^& npm install
    set /a ERRORS+=1
) else (
    echo ✅ Dependencias del servidor instaladas
)

REM Check client node_modules
if not exist "client\node_modules" (
    echo ❌ Dependencias del cliente no instaladas
    echo    Ejecuta: cd client ^&^& npm install
    set /a ERRORS+=1
) else (
    echo ✅ Dependencias del cliente instaladas
)

echo.
echo ⚙️  Verificando configuración...

REM Check server .env
if not exist "server\.env" (
    echo ❌ Archivo server\.env no existe
    echo    Crea el archivo con:
    echo    DATABASE_URL="postgresql://postgres:password@localhost:5432/teamworks?schema=public"
    echo    JWT_SECRET="tu-secreto-seguro-aqui"
    echo    PORT=3000
    set /a ERRORS+=1
) else (
    echo ✅ Archivo server\.env existe
    
    REM Check for required variables
    findstr /C:"DATABASE_URL" server\.env >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo ⚠️  DATABASE_URL no configurado en server\.env
        set /a WARNINGS+=1
    )
    
    findstr /C:"JWT_SECRET" server\.env >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo ⚠️  JWT_SECRET no configurado en server\.env
        set /a WARNINGS+=1
    )
)

REM Check if server is built
if not exist "server\dist" (
    echo ⚠️  Servidor no compilado
    echo    Ejecuta: cd server ^&^& npm run build
    set /a WARNINGS+=1
) else (
    echo ✅ Servidor compilado
)

REM Check Prisma Client
if not exist "server\node_modules\.prisma\client" (
    if not exist "server\node_modules\@prisma\client" (
        echo ⚠️  Prisma Client no generado
        echo    Ejecuta: cd server ^&^& npm run prisma:generate
        set /a WARNINGS+=1
    ) else (
        echo ✅ Prisma Client generado
    )
) else (
    echo ✅ Prisma Client generado
)

echo.
echo 🗄️  Verificando PostgreSQL...

REM Check if PostgreSQL port is listening
netstat -an | findstr ":5432" | findstr "LISTENING" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL está corriendo en puerto 5432
) else (
    echo ❌ PostgreSQL no responde en localhost:5432
    echo    Inicia PostgreSQL o usa Docker:
    echo    docker run --name teamworks-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
    set /a ERRORS+=1
)

REM Check if port 3000 is in use
netstat -an | findstr ":3000" | findstr "LISTENING" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  Puerto 3000 ya está en uso
    echo    Si es el servidor anterior, detenlo primero
    set /a WARNINGS+=1
) else (
    echo ✅ Puerto 3000 disponible
)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if %ERRORS% EQU 0 (
    if %WARNINGS% EQU 0 (
        echo ✅ ¡Todo listo! Puedes iniciar los servidores:
        echo.
        echo    Terminal 1: cd server ^&^& npm start
        echo    Terminal 2: cd client ^&^& npm run dev
        echo.
        echo    O usa: dev.bat
        exit /b 0
    ) else (
        echo ⚠️  Hay !WARNINGS! advertencia^(s^), pero puedes intentar iniciar
        echo.
        echo    Terminal 1: cd server ^&^& npm start
        echo    Terminal 2: cd client ^&^& npm run dev
        exit /b 0
    )
) else (
    echo ❌ Hay !ERRORS! error^(es^) que debes corregir antes de iniciar
    echo.
    echo    Lee los mensajes arriba y corrige los problemas
    exit /b 1
)
