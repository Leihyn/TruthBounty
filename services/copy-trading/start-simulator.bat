@echo off
cd /d "C:\Users\farr\Desktop\dev\truthbounty-mvp\services\copy-trading"
pm2 resurrect
pm2 start ecosystem.config.js --update-env
