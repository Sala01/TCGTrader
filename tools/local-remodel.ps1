param(
  [string]$RawTask = ""
)

$ErrorActionPreference = "Stop"

# 1) Toma la instrucción desde el input del workflow o comentario
if (-not $RawTask -or $RawTask -eq "") { $RawTask = "$env:INPUT_TASK" }
if (-not $RawTask -or $RawTask -eq "") { $RawTask = "$env:COMMENT" }
# Quita el prefijo /remodel o /refactor (case-insensitive)
$Task = ($RawTask -ireplace '^(\/(remodel|refactor))\s*','').Trim()
if (-not $Task) { $Task = "Remodelar Home a grid de botones de navegación" }

# 2) Prepara git/branch (epoch para evitar colisiones)
try {
  $epoch = [int][double]::Parse((Get-Date -UFormat %s))
} catch {
  # Fallback si -UFormat no está disponible
  $epoch = [int]([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
}
$branch = "ai/remodel/$epoch"

git config user.name  "ai-remodeler-bot" | Out-Null
git config user.email "bot@local" | Out-Null
git checkout -b $branch

# 3) Asegura Ollama encendido (ruta fija en tu Windows)
$ollamaExe = "C:\Users\exsal\AppData\Local\Programs\Ollama\ollama.exe"
if (-not (Test-Path $ollamaExe)) {
  Write-Error "No se encontró Ollama en: $ollamaExe"
  exit 1
}

# Arranca 'ollama serve' si no está corriendo
$ollama = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if (-not $ollama) {
  Start-Process -FilePath $ollamaExe -ArgumentList "serve" -WindowStyle Hidden
  Start-Sleep -Seconds 3
}

# Verifica/descarga el modelo si falta (idempotente)
try { & $ollamaExe list | Out-Null } catch { Start-Sleep -Seconds 2 }
try { & $ollamaExe pull qwen2.5-coder:7b | Out-Null } catch { }

# 4) Ubica Aider (lo instala el workflow y expone AIDER_EXE). Fallback al PATH.
$aiderExe = $env:AIDER_EXE
if (-not $aiderExe -or -not (Test-Path $aiderExe)) {
  $aiderExe = (Get-Command aider -ErrorAction SilentlyContinue)?.Source
}
if (-not $aiderExe -or -not (Test-Path $aiderExe)) {
  Write-Error "No se encontró Aider. Define AIDER_EXE o instala 'aider' en el PATH."
  exit 1
}

# 5) Define alcance del repo (limita carpetas grandes si existen)
$includePaths = @("app","src","packages","apps","lib") | Where-Object { Test-Path $_ }
if ($includePaths.Count -eq 0) { $includePaths = @(".") }

# 6) Guía para la remodelación
$guide = @"
Eres un senior engineer. Haz cambios mínimos pero efectivos.
Objetivo: $Task
Reglas:
- Si faltan rutas/pantallas mínimas, créalas.
- Mantén tema oscuro TCG Trader (fondo #0A0F1C, cards #1C1C2E, texto blanco, acentos #00B0FF/#FFB300).
- Usa convenciones existentes (React Navigation/Angular Router), accesibilidad, Pressable con ripple en Android.
- Aplica formateo si es posible y realiza commits con mensajes claros.
"@

# 7) Construye argumentos de Aider (con detección de soporte para --weak-model)
function Test-AiderSupportsWeakModel {
  try {
    $help = & $aiderExe --help 2>&1 | Out-String
    return ($help -like "*--weak-model*")
  } catch { return $false }
}

$baseArgs = @(
  "--model","ollama:qwen2.5-coder:7b",
  "--yes",
  "--auto-commits",
  "--message",$guide
)

if (Test-AiderSupportsWeakModel) {
  $baseArgs = @(
    "--model","ollama:qwen2.5-coder:7b",
    "--weak-model","ollama:qwen2.5-coder:7b",
    "--yes",
    "--auto-commits",
    "--message",$guide
  )
} else {
  Write-Host "Aider no soporta --weak-model en esta versión. Continuando sin ese flag..."
}

$aiderArgs = $baseArgs + $includePaths

Write-Host "Lanzando Aider con tarea: $Task"
try {
  & $aiderExe @aiderArgs
} catch {
  Write-Warning "Aider terminó con error: $($_.Exception.Message)"
}

# 8) Empuja cambios y crea PR
$pushOk = $true
try {
  git push -u origin $branch
} catch {
  $pushOk = $false
  Write-Host "No hay cambios para empujar o hubo un error en el push."
}

if ($pushOk) {
  if (Get-Command gh -ErrorAction SilentlyContinue) {
    # Intentar PR a develop y si falla, a main
    $prTitle = "AI Remodel: $Task"
    $prBody  = "Cambios generados por Aider (modelo local vía Ollama)."
    $created = $false
    try {
      gh pr create --title $prTitle --body $prBody --base develop --head $branch
      $created = $true
    } catch {
      try {
        gh pr create --title $prTitle --body $prBody --base main --head $branch
        $created = $true
      } catch {
        Write-Host "No se pudo crear el PR automáticamente. Crea el PR manual desde la rama $branch."
      }
    }
    if ($created) { Write-Host "Pull Request creado correctamente." }
  } else {
    Write-Host "gh no está instalado. Rama creada: $branch (crea PR manualmente)."
  }
} else {
  Write-Host "No se empujó la rama; omitiendo creación de PR."
}
