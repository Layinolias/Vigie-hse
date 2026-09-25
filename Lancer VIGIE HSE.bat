@echo off
rem VIGIE HSE : double-cliquer sur ce fichier pour lancer l application (voir LISEZ-MOI.txt).
chcp 65001 >nul
title VIGIE HSE
cd /d "%~dp0"
where node >/dev/null 2>nul
if errorlevel 1 (
  echo.
  echo   VIGIE HSE a besoin de Node.js, qui n est pas installe sur cet ordinateur.
  echo   Installez la version LTS depuis https://nodejs.org puis relancez ce fichier.
  echo.
  start "" "https://nodejs.org/fr/download"
  pause
  exit /b 1
)
node serveur\lancer-poste.js
echo.
echo   VIGIE HSE est arrete. Vous pouvez fermer cette fenetre.
pause
