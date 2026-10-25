#!/usr/bin/env bash
# Executa todos os testes automatizados. Requer Node 18+ e nenhuma dependência.
set -e
cd "$(dirname "$0")"
node logic.mjs
node worker-check.mjs
node smoke.mjs
node tasks-views.mjs
node backend-smoke.mjs
