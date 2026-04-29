Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\\backend'; uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
Set-Location "$PSScriptRoot\frontend"
npm run dev
