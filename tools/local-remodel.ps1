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

# 2) Prepara git/branch
$branch = "ai/remodel/" + [int][double]::Parse((Get-Date -UFormat %s))
git config user.name  "ai-remodeler-bot" | Out-Null
git config user.email "bot@local" | Out-Null
git checkout -b $branch

# 3) Asegura Ollama encendido (ruta fija en tu Windows)
$ollamaExe = "C:\Users\exsal\AppData\Local\Programs\Ollama\ollama.exe"
if (-not (Test-Path $ollamaExe)) { Write-Error "No se encontró Ollama en: $ollamaExe"; exit 1 }
$ollama = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if (-not $ollama) {
  Start-Process -FilePath $ollamaExe -ArgumentList "serve" -WindowStyle Hidden
  Start-Sleep -Seconds 3
}
# Verifica y descarga el modelo si falta (idempotente)
try { & $ollamaExe list | Out-Null } catch { Start-Sleep -Seconds 2 }
try { & $ollamaExe pull qwen2.5-coder:7b } catch { }

# 4) Ubica Aider (lo instala el workflow y expone AIDER_EXE)
$aiderExe = $env:AIDER_EXE
if (-not $aiderExe -or -not (Test-Path $aiderExe)) {
  Write-Error "No se encontró Aider (AIDER_EXE). Revisa el paso de instalación en el workflow."; exit 1
}

# 5) Modo no-interactivo + provider Ollama
$env:PYTHONIOENCODING = "utf-8"
$env:TERM = "xterm"
# Fija la URL del daemon de Ollama
if (-not $env:OLLAMA_HOST) { $env:OLLAMA_HOST = "http://127.0.0.1:11434" }
# Algunas builds usan OLLAMA_BASE_URL; setéala también por si acaso
if (-not $env:OLLAMA_BASE_URL) { $env:OLLAMA_BASE_URL = $env:OLLAMA_HOST }

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

# 7) Ejecuta Aider con el modelo local de Ollama
#   - Usa repo raíz "." y flags no-interactivos
$aiderArgs = @(
  "--model","ollama/qwen2.5-coder:7b",
  "--yes","--auto-commits",
  "--no-pretty","--git","--no-show-model-warnings","--no-gitignore",
  "--message",$guide,
  "."
)

Write-Host "Lanzando Aider con tarea: $Task"
& $aiderExe @aiderArgs

# 8) Empuja cambios y crea PR
try { git push -u origin $branch } catch { Write-Host "No hay cambios para empujar o hubo un error en el push." }

if (Get-Command gh -ErrorAction SilentlyContinue) {
  try {
    gh pr create --title "AI Remodel: $Task" --body "Cambios generados por Aider (modelo local via Ollama)." --base develop --head $branch
  } catch {
    try {
      gh pr create --title "AI Remodel: $Task" --body "Cambios generados por Aider (modelo local via Ollama)." --base main --head $branch
    } catch {
      Write-Host "No se pudo crear el PR automáticamente. Crea el PR manual desde la rama $branch."
    }
  }
} else {
  Write-Host "gh no está instalado. Rama creada: $branch (crea PR manualmente)."
}
