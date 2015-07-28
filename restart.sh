forever stop ./app.js
echo "stop app.js"
forever -o ./log/log.log -e ./log/err.log start app.js