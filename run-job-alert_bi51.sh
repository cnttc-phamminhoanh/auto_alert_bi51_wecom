mkdir -p /home/it/auto_alert_bi51_wecom/logs
mkdir -p /home/it/auto_alert_bi51_wecom/reports

/home/it/.nvm/versions/node/v22.18.0/bin/node --no-warnings auto_alert_bi51_wecom/scripts/run-job-alert_bi51.js alert_bi51 >> auto_alert_bi51_wecom/logs/alert_bi51.log 2>&1
