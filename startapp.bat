@echo off
REM =================================================================
REM  DR Utility Master Start Script
REM  This script launches both the backend and frontend servers
REM  in separate terminal windows.
REM  Run this script from the project's root directory.
REM =================================================================

echo Starting the DR Utility application...
echo.

REM --- Start the Backend Server ---
echo [1/2] Launching Backend Server in a new window...
REM The "start" command is non-blocking.
REM "DR Backend" is the title of the new window.
REM "cmd /k" keeps the window open for debugging.
REM We use 'cd backend' to change the directory INSIDE the new window,
REM so all backend commands (venv, uvicorn) work correctly.

start "DR Backend" cmd /k "cd backend && call .venv\Scripts\activate && uvicorn app.main:app --reload"

REM A small pause to let the first window initialize
timeout /t 2 >nul

REM --- Start the Frontend Server ---
echo [2/2] Launching Frontend Server in a new window...
REM Same logic: change directory to the React app's folder
REM and then run npm start.

start "DR Frontend" cmd /k "cd frontend\dr-assistant-react && npm start"

echo.
echo Both backend and frontend launch commands have been issued.
echo Please check the two new terminal windows that have opened.