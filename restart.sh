forever stop ./app.js
echo "stop app.js"
forever -o /data/log/badjs/badjs-storage/log.log -e /data/log/badjs/badjs-storage/err.log start app.js