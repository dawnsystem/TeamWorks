# Script para agregar reglas de Firewall para TeamWorks
# EJECUTAR COMO ADMINISTRADOR

Write-Host "=== CONFIGURACIÓN DE FIREWALL PARA TEAMWORKS ===" -ForegroundColor Cyan
Write-Host ""

# Verificar si se está ejecutando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERROR: Este script debe ejecutarse como ADMINISTRADOR" -ForegroundColor Red
    Write-Host ""
    Write-Host "Haz clic derecho en PowerShell y selecciona 'Ejecutar como administrador'" -ForegroundColor Yellow
    Write-Host "Luego ejecuta este script de nuevo." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit
}

Write-Host "✅ Ejecutando como administrador..." -ForegroundColor Green
Write-Host ""

# Agregar regla para Backend (Puerto 3000)
Write-Host "1. Agregando regla para Backend (Puerto 3000)..." -ForegroundColor Yellow
try {
    # Verificar si la regla ya existe
    $existingRule = Get-NetFirewallRule -DisplayName "TeamWorks Backend (Port 3000)" -ErrorAction SilentlyContinue
    
    if ($existingRule) {
        Write-Host "   ⚠️  La regla ya existe. Eliminando regla antigua..." -ForegroundColor Yellow
        Remove-NetFirewallRule -DisplayName "TeamWorks Backend (Port 3000)"
    }
    
    # Crear la regla
    New-NetFirewallRule -DisplayName "TeamWorks Backend (Port 3000)" `
                        -Direction Inbound `
                        -Protocol TCP `
                        -LocalPort 3000 `
                        -Action Allow `
                        -Profile Private,Public `
                        -Description "Permite conexiones al backend de TeamWorks en puerto 3000"
    
    Write-Host "   ✅ Regla para Backend agregada correctamente" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error al agregar regla para Backend: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Agregar regla para Frontend (Puerto 5173)
Write-Host "2. Agregando regla para Frontend (Puerto 5173)..." -ForegroundColor Yellow
try {
    # Verificar si la regla ya existe
    $existingRule = Get-NetFirewallRule -DisplayName "TeamWorks Frontend (Port 5173)" -ErrorAction SilentlyContinue
    
    if ($existingRule) {
        Write-Host "   ⚠️  La regla ya existe. Eliminando regla antigua..." -ForegroundColor Yellow
        Remove-NetFirewallRule -DisplayName "TeamWorks Frontend (Port 5173)"
    }
    
    # Crear la regla
    New-NetFirewallRule -DisplayName "TeamWorks Frontend (Port 5173)" `
                        -Direction Inbound `
                        -Protocol TCP `
                        -LocalPort 5173 `
                        -Action Allow `
                        -Profile Private,Public `
                        -Description "Permite conexiones al frontend de TeamWorks en puerto 5173"
    
    Write-Host "   ✅ Regla para Frontend agregada correctamente" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error al agregar regla para Frontend: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== CONFIGURACIÓN COMPLETADA ===" -ForegroundColor Cyan
Write-Host ""

# Verificar las reglas
Write-Host "3. Verificando reglas agregadas..." -ForegroundColor Yellow
Write-Host ""

$backendRule = Get-NetFirewallRule -DisplayName "TeamWorks Backend (Port 3000)" -ErrorAction SilentlyContinue
if ($backendRule) {
    Write-Host "   ✅ Backend Rule: ACTIVA" -ForegroundColor Green
    Write-Host "      Puerto: 3000" -ForegroundColor Gray
    Write-Host "      Estado: $($backendRule.Enabled)" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Backend Rule: NO ENCONTRADA" -ForegroundColor Red
}

Write-Host ""

$frontendRule = Get-NetFirewallRule -DisplayName "TeamWorks Frontend (Port 5173)" -ErrorAction SilentlyContinue
if ($frontendRule) {
    Write-Host "   ✅ Frontend Rule: ACTIVA" -ForegroundColor Green
    Write-Host "      Puerto: 5173" -ForegroundColor Gray
    Write-Host "      Estado: $($frontendRule.Enabled)" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Frontend Rule: NO ENCONTRADA" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== SIGUIENTE PASO ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ahora prueba desde tu móvil:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Conecta el móvil a la MISMA WiFi que tu PC" -ForegroundColor White
Write-Host "2. Abre el navegador del móvil" -ForegroundColor White
Write-Host "3. Ve a: http://192.168.0.165:3000/health" -ForegroundColor Cyan
Write-Host "4. Deberías ver: {`"status`":`"ok`",...}" -ForegroundColor White
Write-Host ""
Write-Host "Si funciona, abre la app:" -ForegroundColor Yellow
Write-Host "   http://192.168.0.165:5173" -ForegroundColor Cyan
Write-Host ""

Read-Host "Presiona Enter para salir"
