@echo off
echo Starting Django Development Server with Enhanced Auto-Reload...
echo.
echo The server will automatically reload when you make changes to:
echo - Python files (.py)
echo - Templates (.html)
echo - CSS/JS files (may need browser refresh)
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "c:\Users\ISRAEL\Desktop\django project\Prototype"
".venv\Scripts\python.exe" manage.py runserver --verbosity=2
pause
