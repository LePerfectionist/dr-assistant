@echo off
REM Check if .env file exists in app folder
if not exist ".env" (
    echo [SKIP] .env file not found in project root folder. Please place it outside app. Exiting.
    exit /b
)

REM Check if virtual environment is activated
if not defined VIRTUAL_ENV (
    if not exist ".venv\Scripts\activate" (
        echo Creating virtual environment...
        python -m venv .venv

        echo Activating virtual environment...
        .venv\Scripts\activate

        echo Installing requirements...
        pip install -r requirements.txt

        echo Migrating to database...
        alembic upgrade head
    )
    
    .venv\Scripts\activate
) else (
    echo Virtual environment already activated.
)

echo Running app...
uvicorn app.main:app --reload
