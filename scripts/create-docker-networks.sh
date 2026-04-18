#!/usr/bin/env bash
set -euo pipefail

networks=("backend_net" "frontend_backend_net" "mobile_backend_net")

for network in "${networks[@]}"; do
  if docker network inspect "$network" >/dev/null 2>&1; then
    echo "Network already exists: $network"
  else
    docker network create "$network" >/dev/null
    echo "Created network: $network"
  fi
done
