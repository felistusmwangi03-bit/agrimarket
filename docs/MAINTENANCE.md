# AgriMarket maintenance schedule

| Area | Task | How often | Who / how |
|---|---|---|---|
| Backup | Export the MySQL database (`mysqldump -h HOST -P PORT -u USER -p --ssl-mode=REQUIRED DBNAME > backup-YYYY-MM-DD.sql`) and store it off the server (cloud drive) | Weekly, and before every update | Developer |
| Backup | Keep the last 4 weekly backups and 1 monthly backup | Monthly clean-up | Developer |
| Recovery | Test-restore the latest backup into a fresh database (`mysql ... < backup.sql`) and log in with a demo account | Quarterly | Developer |
| Recovery | If a bad deploy breaks the site: Render dashboard > Events > roll back to the last working deploy | When needed (target: under 30 minutes) | Developer |
| Dependencies | Run `npm outdated`, then `npm update`; test locally before pushing | Monthly | Developer |
| Dependencies | Run `npm audit` and fix high/critical issues | Monthly, and when GitHub Dependabot alerts | Developer |
| Dependencies | Upgrade Node.js to the current LTS version | Every 6-12 months | Developer |
| Security | Review users and admin accounts; remove unused accounts | Monthly | Admin |
| Security | Rotate `JWT_SECRET` and the database password (log everyone out afterwards) | Every 6 months, or immediately after a leak | Developer |
| Security | Check the HTTPS padlock and certificate renewal; confirm no secrets in Git (`git log -p` search for passwords) | Monthly | Developer |
| Security | Re-run the test suite (`node tests/run-tests.js`) after every change | Every change | Developer |
| Health monitoring | Check the platform logs for errors and the `/api/health` address | Daily during the first week, then weekly | Developer |
| Health monitoring | External uptime check on `/api/health` (for example UptimeRobot, every 5 minutes) with an email alert | Continuous | Automatic |
| Health monitoring | Review database size and connection errors | Monthly | Developer |
