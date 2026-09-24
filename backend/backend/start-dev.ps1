$ErrorActionPreference = 'Stop'

$python = Join-Path $PSScriptRoot '.venv-cpu\Scripts\python.exe'

if (-not (Test-Path $python)) {
    throw "CPU virtual environment not found at $python"
}

Push-Location $PSScriptRoot
try {
    & $python manage.py migrate --noinput
    & $python manage.py runserver
}
finally {
    Pop-Location
}