# Script de configuracion de Tailscale para TeamWorks
# Ejecutar como: .\setup-tailscale.ps1

Write-Host "Configurando TeamWorks para Tailscale..." -ForegroundColor Cyan
Write-Host ""

# Obtener IP de Tailscale
Write-Host "Obteniendo tu IP de Tailscale..." -ForegroundColor Yellow
$tailscaleIP = (tailscale ip -4 2>&1)

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Tailscale no esta instalado o no esta corriendo" -ForegroundColor Red
    Write-Host "Instala Tailscale desde: https://tailscale.com/download" -ForegroundColor Yellow
    exit 1
}

Write-Host "Tu IP de Tailscale: $tailscaleIP" -ForegroundColor Green
Write-Host ""

# Preguntar que usar: dominio o IP
$useIP = Read-Host "Deseas usar el dominio MagicDNS (davidhp.tail1c095e.ts.net) o la IP ($tailscaleIP)? [D/i]"

if ($useIP -eq "i" -or $useIP -eq "I") {
    $apiURL = "http://${tailscaleIP}:3000/api"
    $frontendURL = "http://${tailscaleIP}:5173"
    Write-Host "Usando IP directa" -ForegroundColor Cyan
} else {
    $apiURL = "http://davidhp.tail1c095e.ts.net:3000/api"
    $frontendURL = "http://davidhp.tail1c095e.ts.net:5173"
    Write-Host "Usando dominio MagicDNS" -ForegroundColor Cyan
}

Write-Host ""

# Configurar Backend
Write-Host "Configurando backend..." -ForegroundColor Yellow

$serverEnvPath = ".\server\.env"
$groqAPIKey = "tu-api-key-de-groq-aqui"

# Preguntar si ya existe .env
if (Test-Path $serverEnvPath) {
    Write-Host "Ya existe server\.env" -ForegroundColor Yellow
    $overwrite = Read-Host "Deseas actualizarlo? [S/n]"
    if ($overwrite -eq "n" -or $overwrite -eq "N") {
        Write-Host "Saltando configuracion del backend" -ForegroundColor Yellow
    } else {
        # Actualizar FRONTEND_URL
        $content = Get-Content $serverEnvPath
        $newContent = $content -replace 'FRONTEND_URL=.*', "FRONTEND_URL=`"$frontendURL`""
        $newContent | Set-Content $serverEnvPath
        Write-Host "Backend actualizado" -ForegroundColor Green
    }
} else {
    # Crear nuevo .env
    $envContent = @"
DATABASE_URL="postgresql://postgres:password@localhost:5432/teamworks?schema=public"
PORT=3000
NODE_ENV=development
GROQ_API_KEY="$groqAPIKey"
FRONTEND_URL="$frontendURL"
"@
    $envContent | Set-Content $serverEnvPath
    Write-Host "Backend configurado" -ForegroundColor Green
}

# Configurar Frontend
Write-Host "Configurando frontend..." -ForegroundColor Yellow

$clientEnvPath = ".\client\.env"

if (Test-Path $clientEnvPath) {
    Write-Host "Ya existe client\.env" -ForegroundColor Yellow
    $overwrite = Read-Host "Deseas actualizarlo? [S/n]"
    if ($overwrite -eq "n" -or $overwrite -eq "N") {
        Write-Host "Saltando configuracion del frontend" -ForegroundColor Yellow
    } else {
        "VITE_API_URL=$apiURL" | Set-Content $clientEnvPath
        Write-Host "Frontend actualizado" -ForegroundColor Green
    }
} else {
    "VITE_API_URL=$apiURL" | Set-Content $clientEnvPath
    Write-Host "Frontend configurado" -ForegroundColor Green
}

Write-Host ""
Write-Host "Configuracion completada!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "1. Edita server\.env y reemplaza 'tu-api-key-de-groq-aqui' con tu API key real" -ForegroundColor Yellow
Write-Host "2. Reinicia ambos servidores:" -ForegroundColor Yellow
Write-Host "   - Terminal 1: cd server && npm run dev" -ForegroundColor Cyan
Write-Host "   - Terminal 2: cd client && npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs de acceso:" -ForegroundColor Green
Write-Host "- Local: http://localhost:5173" -ForegroundColor Cyan
Write-Host "- Red: $frontendURL" -ForegroundColor Cyan
