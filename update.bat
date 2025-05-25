@echo off
cd /d %~dp0
call mvn clean compile exec:java -Dexec.mainClass="org.example.Main"
git add docs/output.csv
git commit -m "Daily update - %date%"
git push origin main
