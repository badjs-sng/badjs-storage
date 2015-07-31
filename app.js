var log4js = require('log4js'),
    logger = log4js.getLogger();



var argv = process.argv.slice(2);
if(argv.indexOf('--project') >= 0){
    GLOBAL.pjconfig =  require('./project.debug.json');
}else {
    GLOBAL.pjconfig = require('./project.json');
}

if(argv.indexOf('--debug') >= 0){
    logger.setLevel('DEBUG');
    global.debug = true;
}else {
    logger.setLevel('INFO');
}


GLOBAL.MONGDO_URL = GLOBAL.pjconfig.mongodb.url;
if ("shard" in GLOBAL.pjconfig.mongodb) {
    GLOBAL.MONGO_SHARD = true;
    GLOBAL.MONGO_ADMIN_USER = GLOBAL.pjconfig.mongodb.adminUser;
    GLOBAL.MONGO_ADMIN_PASSWORD = GLOBAL.pjconfig.mongodb.adminPassword;
} else {
    GLOBAL.MONGO_SHARD = false;
}
var dispatcher = require(GLOBAL.pjconfig.acceptor.module)
  , save = require('./storage/MongodbStorage');


// use zmq to dispatch
dispatcher()
  .pipe(save());


logger.log('badjs-storage start ...');

setTimeout(function (){
    require('./service/query')();
    require('./service/autoClear')();
},1000);
