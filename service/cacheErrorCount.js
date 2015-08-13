var MongoClient = require('mongodb').MongoClient,
    connect = require('connect');

var fs = require("fs"),
    path = require("path");

var log4js = require('log4js'),
    logger = log4js.getLogger();
var dbName = "count_";
var saveDate;

var url = global.MONGDO_URL;
var mongoDB;
// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db) {
    if(err){
        logger.info("failed connect to server");
    }else {
        logger.info("Connected correctly to server");
    }
    mongoDB = db;
});



function insertErrorCount() {
    MongoClient.collections(function (error, collections) {
        collections.forEach(function (collection, key) {
            if (collection.s.name.indexOf("badjs") < 0) {
                return;
            }
            logger.info("start count " + collection.s.name);
            var endDate = new Date(),startDate = new Date(new Date().getTime() - 6*60*60*1000);
            var cursor = collection.aggregate([
                {$match: {'date': {$lt: endDate, $gt: startDate}}},
                {
                    $group: {
                        _id: {
                            time: {$dateToString: {format: "%Y-%m-%d %H:%M", date: '$date'}}
                        },
                        count: {$sum: 1}
                    }
                },
                {$sort: {"_id": 1}}
            ]);
            cursor.toArray(function (err, result) {
                if (global.debug == true) {
                    logger.debug("query error is=" + JSON.stringify(err));
                    logger.debug("query result is=" + JSON.stringify(result))
                }
                result.forEach(function (item) {
                    item.time = item._id.time;
                    delete item._id;
                });
                insertToMongo(collection.s.name,result);
            });
        })
    });
}

function insertToMongo(name,data){
    var collection = db.collection(dbName+name);
    collection.insert(data,function(err,result){
        if(err){
            console.log("insert mongo err:"+err);
            return;
        }else{
            console.log(result);
        }
    })
}

function getErrorCount(appid,startTime,endTime){

    var collection = db.collection('count_badjslog_'+appid);
    var queryJson = {};
    queryJson.time = {$lt: endTime, $gt: startTime};
    collection.find(queryJson).toArray(function(err,result){
        if(err){
            console.log(err);
            return JSON.parse(err);
        }
        result.map(function(ele){
           ele.time = new Date(ele.time).getTime() + 28800000;
        });
        return JSON.parse(result);
    })

    /*var filePath = path.join('.','cache','cacheCountTotal','badjslog_'+appid),
     result = {};
    if(fs.existsSync(filePath)){
        result.ok = true;
        result.data = JSON.parse(fs.readFileSync(filePath));
    }else{
        result.message = "file error";
        result.ok = false;
    }
    return result;*/
}


module.exports = {
    insertAuto:function(){
        insertErrorCount();
    },
    getCount: function(appid,startTime,endTime){
        getErrorCount(appid,startTime,endTime);
    }
}