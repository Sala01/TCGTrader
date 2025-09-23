#!/usr/bin/env bash
set -euo pipefail

RAW_TASK="${1:-}"
# Extrae texto después de /remodel si viene en un comentario
TASK="$(echo "$RAW_TASK" | sed -E 's@^/(remodel|refactor)[[:space:]]*@@i')"
[ -z "$TASK" ] && TASK="Remodelar Home a grid de botones de navegación"

BRANCH="ai/remodel/$(date +%s)"
git config user.name  "ai-remodeler-bot"
git config user.email "bot@local"

git checkout -b "$BRANCH"

# Aider con modelo local vía Ollama. Limita el contexto a carpetas típicas.
INCLUDE_PATHS="app src packages apps lib"

# Prompt guía para que haga cambios concretos y mínimos.
GUIDE=$'Eres un senior engineer. Haz cambios mínimos pero efectivos.\n'\
$'Objetivo: '"$TASK"$'\n'\
$'Reglas:\n'\
$'- Si faltan rutas/pantallas mínimas, créalas.\n'\
$'- Mantén tema oscuro TCG Trader (fondo #0A0F1C, cards #1C1C2E, texto blanco, acentos #00B0FF/#FFB300).\n'\
$'- Usa convenciones existentes (React Navigation/Angular Router), accesibilidad, Pressable con ripple.\n'\
$'- Ejecuta formateo si es posible y crea commits con mensajes claros.\n'

# Ejecuta aider (modelo local vía Ollama)
# Más modelos: `ollama list`
aider \
  --model ollama:qwen2.5-coder:7b \
  --weak-model ollama:qwen2.5-coder:7b \
  --yes --auto-commits \
  --message "$GUIDE" \
  $(for d in $INCLUDE_PATHS; do [ -d "$d" ] && echo "$d"; done)

# Si no hubo commits, salir limpio
if git diff --quiet origin/HEAD..HEAD 2>/dev/null; then
  echo "No hay cambios que empujar."
  exit 0
fi

git push -u origin "$BRANCH"

# Crea PR si hay gh CLI, si no, solo informa rama
if command -v gh >/dev/null 2>&1; then
  gh pr create --title "AI Remodel: $TASK" --body "Cambios generados por Aider (modelo local via Ollama)." --base develop --head "$BRANCH" || \
  gh pr create --title "AI Remodel: $TASK" --body "Cambios generados por Aider (modelo local via Ollama)." --base main --head "$BRANCH"
else
  echo "Rama creada y subida: $BRANCH (crea PR manualmente)"
fi
