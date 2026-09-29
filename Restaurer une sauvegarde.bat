@echo off
rem VIGIE HSE : revenir a une sauvegarde de vos donnees (voir LISEZ-MOI.txt, section 9).
chcp 65001 >nul
title VIGIE HSE - restauration
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   VIGIE HSE a besoin de Node.js, qui n est pas installe sur cet ordinateur.
  echo   Installez la version LTS depuis https://nodejs.org puis relancez ce fichier.
  echo.
  pause
  exit /b 1
)
node serveur\restaurer.js
pause
