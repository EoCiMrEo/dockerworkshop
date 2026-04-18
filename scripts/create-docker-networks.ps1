$networks = @('backend_net', 'frontend_backend_net', 'mobile_backend_net')

foreach ($network in $networks) {
  $exists = docker network ls --format '{{.Name}}' | Where-Object { $_ -eq $network }

  if ($exists) {
    Write-Host "Network already exists: $network"
  }
  else {
    docker network create $network | Out-Null
    Write-Host "Created network: $network"
  }
}
