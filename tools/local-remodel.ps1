param(
  [string]$RawTask = ""
)

$ErrorActionPreference = "Stop"

# 1) Normaliza la instrucción
if (-not $RawTask -or $RawTask -eq "") {
  $RawTask = "$env:INPUT_TASK"
}
if (-not $RawTask -or $RawTask -eq "") {
  $RawTask = "$env:COMMENT"
}
$Task = ($RawTask -replace '^(\/(remodel|refactor))\s*','', 'IgnoreCase').Trim()
if (-not $Task) { $Task = "Remodelar Home a grid de botones de navegación" }

# 2) Prepara git/branch
$branch = "ai/remodel/" + [int][double]::Parse((Get-Date -UFormat %s))
git config user.name  "ai-remodeler-bot" | Out-Null
git config user.email "bot@local" | Out-Null
git checkout -b $branch

# 3) Asegura Ollama encendido
$ollamaExe = "C:\Users\exsal\AppData\Local\Programs\Ollama\ollama.exe"
$ollama = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if (-not $ollama) {
  Start-Process -FilePath $ollamaExe -ArgumentList "serve" -NoNewWindow
  Start-Sleep -Seconds 3
}
try { & $ollamaExe list | Out-Null } catch { Write-Host "Ollama no disponible" }
try { & $ollamaExe run qwen2.5-coder:7b -p "ok" | Out-Null } catch { & $ollamaExe pull qwen2.5-coder:7b }

# Modelo local (puedes cambiarlo a llama3.1:8b, etc.)
try {
  & ollama list | Out-Null
} catch {
  Write-Host "Ollama no está disponible en PATH."
}
try {
  & ollama run qwen2.5-coder:7b -p "ok" | Out-Null
} catch {
  & ollama pull qwen2.5-coder:7b
}

# 4) Asegura Aider
$hasAider = (Get-Command aider -ErrorAction SilentlyContinue) -ne $null
if (-not $hasAider) {
  py -m pip install --user aider-chat==0.59.1
  $env:Path += ";" + "$env:USERPROFILE\AppData\Roaming\Python\Python311\Scripts"
}

# 5) Define alcance del repo para que no edite todo si es gigante
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

# 7) Ejecuta Aider con el modelo local de Ollama
$aiderArgs = @(
  "--model","ollama:qwen2.5-coder:7b",
  "--weak-model","ollama:qwen2.5-coder:7b",
  "--yes","--auto-commits",
  "--message",$guide
) + $includePaths

Write-Host "Lanzando Aider con tarea: $Task"
aider @aiderArgs

# 8) Empuja cambios y crea PR
# Si no hubo commits, no habrá diff contra origin
try {
  git push -u origin $branch
} catch {
  Write-Host "No hay cambios para empujar o hubo un error en el push."
}

# Crea PR si existe gh; intenta develop y luego main
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
