@echo off
setlocal

echo ===================================================
echo     CYBERGUARD PRO - GitHub Upload Setup Script
echo ===================================================
echo.
echo Make sure you have created an empty repository on GitHub first!
echo (Do not initialize it with a README or .gitignore)
echo.

set /p username="Enter your exact GitHub Username: "
set /p reponame="Enter your new GitHub Repository Name (e.g., cyberguard-pro): "

echo.
echo Pushing your code to GitHub...
git branch -M main
git remote add origin https://github.com/%username%/%reponame%.git
git push -u origin main

echo.
echo Setup Complete! Your code is now live on your GitHub profile.
pause
