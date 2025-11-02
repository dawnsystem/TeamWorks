@echo off
echo ========================================
echo Configuracion de Base de Datos TeamWorks
echo ========================================
echo.

REM Verificar si Docker Desktop esta corriendo
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Docker Desktop no esta corriendo
    echo [!] Por favor, inicia Docker Desktop y vuelve a ejecutar este script
    pause
    exit /b 1
)

echo [1/4] Iniciando contenedor PostgreSQL...
docker run --name teamworks-db ^
  -e POSTGRES_PASSWORD=password ^
  -e POSTGRES_DB=teamworks ^
  -p 5432:5432 ^
  -d postgres:16-alpine 2>nul

if %errorlevel% neq 0 (
    echo [!] El contenedor ya existe, intentando iniciarlo...
    docker start teamworks-db >nul 2>&1
    if %errorlevel% neq 0 (
        echo [x] Error al iniciar el contenedor
        pause
        exit /b 1
    )
    echo [OK] Contenedor iniciado
) else (
    echo [OK] Contenedor creado e iniciado
)

echo.
echo [2/4] Esperando a que PostgreSQL este listo...
timeout /t 5 /nobreak >nul

echo.
echo [3/4] Verificando conexion...
docker exec teamworks-db psql -U postgres -d teamworks -c "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Esperando un poco mas...
    timeout /t 3 /nobreak >nul
    docker exec teamworks-db psql -U postgres -d teamworks -c "SELECT 1;" >nul 2>&1
)

if %errorlevel% equ 0 (
    echo [OK] PostgreSQL esta funcionando correctamente
) else (
    echo [x] Error al conectar con PostgreSQL
    pause
    exit /b 1
)

echo.
echo [4/4] Ejecutando migraciones de Prisma...
cd server
call npm run prisma:generate
if %errorlevel% neq 0 (
    echo [x] Error al generar Prisma Client
    pause
    exit /b 1
)

call npm run prisma:migrate
if %errorlevel% neq 0 (
    echo [x] Error al ejecutar migraciones
    pause
    exit /b 1
)

cd ..
echo.
echo ========================================
echo [OK] Base de datos configurada correctamente
echo ========================================
echo.
echo La base de datos esta lista para usar:
echo - Host: localhost
echo - Puerto: 5432
echo - Base de datos: teamworks
echo - Usuario: postgres
echo - Contrasena: password
echo.
echo Asegurate de que tu archivo server/.env contenga:
echo DATABASE_URL="postgresql://postgres:password@localhost:5432/teamworks?schema=public"
echo.
pause

