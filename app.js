var log4js = require('log4js'),
    logger = log4js.getLogger();

var path = require("path");



var argv = process.argv.slice(2);
if(argv.indexOf('--project') >= 0){
    GLOBAL.pjconfig =  require(path.join(__dirname , 'project.debug.json'));
}else {
    GLOBAL.pjconfig = require(path.join(__dirname , 'project.json'));
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
GLOBAL.MONGODB = GLOBAL.pjconfig.mongodb;
var dispatcher = require(GLOBAL.pjconfig.acceptor.module)
  , save = require('./storage/MongodbStorage');
var cacheCount = require('./service/cacheErrorCount');


// use zmq to dispatch
dispatcher()
  .pipe(save());


logger.info('start badjs-storage success.');

setTimeout(function (){
    require('./service/query')();
    cacheCount.insertAuto();
    require('./service/autoClear')();
},1000);
