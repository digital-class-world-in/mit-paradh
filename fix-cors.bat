@echo off
echo Fixing CORS for mit-paradh.firebasestorage.app...
gcloud storage cors set cors.json gs://mit-paradh.firebasestorage.app
echo Fixing CORS for mit-paradh.appspot.com...
gcloud storage cors set cors.json gs://mit-paradh.appspot.com
echo Done!
pause
