@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"

if not exist "package.json" (
  echo ERROR: Coloca este archivo en la raiz de PM-Intelligence-Workspace.
  echo Debe quedar junto a package.json.
  pause
  exit /b 1
)

set "OUT=IW006_CONTEXTO_ACTUAL.txt"

> "%OUT%" echo PM INTELLIGENCE WORKSPACE - IW-006 CONTEXTO ACTUAL
>> "%OUT%" echo Generado: %date% %time%
>> "%OUT%" echo Directorio: %cd%
>> "%OUT%" echo.

>> "%OUT%" echo ============================================================
>> "%OUT%" echo GIT STATUS
>> "%OUT%" echo ============================================================
git status --short >> "%OUT%" 2>&1

call :append_file "package.json"

call :append_tree "src\features\data-center\importers\inventory"
call :append_tree "src\features\inventory-workspace"
call :append_tree "src\core\business\analytics\inventory"

for /f "delims=" %%F in ('dir /b /s "src\core\business\repository\*inventory*.ts" 2^>nul') do call :append_file "%%F"
for /f "delims=" %%F in ('dir /b /s "src\core\business\entities\*inventory*.ts" 2^>nul') do call :append_file "%%F"

call :append_file "src\features\sales-workspace\export\buildSalesExecutiveExport.ts"
call :append_file "src\features\sales-workspace\export\buildSalesExecutiveExport.test.ts"
call :append_file "docs\ROADMAP.md"
call :append_file "docs\CHANGELOG.md"

>> "%OUT%" echo.
>> "%OUT%" echo ============================================================
>> "%OUT%" echo PRUEBA DIRIGIDA - INVENTORY IMPORT PLUGIN
>> "%OUT%" echo ============================================================
call npm test -- src/features/data-center/importers/inventory/inventoryPlugin.test.ts >> "%OUT%" 2>&1

>> "%OUT%" echo.
>> "%OUT%" echo ============================================================
>> "%OUT%" echo FIN DEL CONTEXTO IW-006
>> "%OUT%" echo ============================================================

echo.
echo Listo: se genero "%OUT%".
echo Sube ese archivo al chat para construir IW-006 sobre los contratos reales.
echo.
pause
exit /b 0

:append_tree
if not exist "%~1" (
  >> "%OUT%" echo.
  >> "%OUT%" echo [DIRECTORIO NO ENCONTRADO] %~1
  exit /b 0
)
for /f "delims=" %%F in ('dir /b /s "%~1\*.ts" "%~1\*.tsx" 2^>nul') do call :append_file "%%F"
exit /b 0

:append_file
if not exist "%~1" (
  >> "%OUT%" echo.
  >> "%OUT%" echo [ARCHIVO NO ENCONTRADO] %~1
  exit /b 0
)
>> "%OUT%" echo.
>> "%OUT%" echo ============================================================
>> "%OUT%" echo FILE: %~1
>> "%OUT%" echo ============================================================
type "%~1" >> "%OUT%"
>> "%OUT%" echo.
exit /b 0
