# Script de Diagnóstico - TeamWorks

Write-Host "=== DIAGNÓSTICO TEAMWORKS ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Backend
Write-Host "1. Verificando Backend..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "   ✅ Backend: OK (Status: $($health.StatusCode))" -ForegroundColor Green
    Write-Host "   Response: $($health.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Backend: NO RESPONDE" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 2. Verificar IP Local
Write-Host "2. Verificando IP Local..." -ForegroundColor Yellow
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}).IPAddress
Write-Host "   IP detectada: $ip" -ForegroundColor Gray

if ($ip) {
    try {
        $healthLocal = Invoke-WebRequest -Uri "http://${ip}:3000/health" -UseBasicParsing -TimeoutSec 3
        Write-Host "   ✅ Backend accesible desde red local: OK" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Backend NO accesible desde red local" -ForegroundColor Red
    }
}

Write-Host ""

# 3. Verificar Frontend
Write-Host "3. Verificando Frontend..." -ForegroundColor Yellow
$frontendPort = netstat -ano | Select-String ":5173.*LISTENING"
if ($frontendPort) {
    Write-Host "   ✅ Frontend corriendo en puerto 5173" -ForegroundColor Green
} else {
    Write-Host "   ❌ Frontend NO está corriendo" -ForegroundColor Red
}

Write-Host ""

# 4. Verificar archivo .env
Write-Host "4. Verificando configuración (.env)..." -ForegroundColor Yellow
$envPath = "client\.env"
if (Test-Path $envPath) {
    Write-Host "   ✅ Archivo .env existe" -ForegroundColor Green
    Write-Host "   Contenido:" -ForegroundColor Gray
    Get-Content $envPath | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
} else {
    Write-Host "   ❌ Archivo .env NO encontrado" -ForegroundColor Red
}

Write-Host ""

# 5. URLs a usar
Write-Host "5. URLs para acceder:" -ForegroundColor Yellow
Write-Host "   PC (localhost):" -ForegroundColor White
Write-Host "      Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "      Backend:  http://localhost:3000/api" -ForegroundColor Cyan
Write-Host ""
if ($ip) {
    Write-Host "   Móvil (red local):" -ForegroundColor White
    Write-Host "      Frontend: http://${ip}:5173" -ForegroundColor Cyan
    Write-Host "      Backend:  http://${ip}:3000/api" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== FIN DEL DIAGNÓSTICO ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para probar manualmente, abre en el navegador:" -ForegroundColor Yellow
Write-Host "http://localhost:3000/health" -ForegroundColor White
Write-Host ""
