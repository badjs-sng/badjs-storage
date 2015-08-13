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
MongoClient.connect(url, function (err, db) {
    if (err) {
        logger.info("failed connect to server");
    } else {
        logger.info("Connected correctly to server");
    }
    mongoDB = db;
});


function insertErrorCount() {
    mongoDB.collections(function (error, collections) {
        if(error){
            logger.info("mongoDB.collections error " + JSON.stringify(error));
            return;
        }
        collections.forEach(function (collection, key) {
            if (collection.s.name.indexOf("badjs") < 0) {
                return;
            }
            logger.info("start count " + collection.s.name);
            var endDate = new Date(), startDate = new Date(new Date().getTime() - 6 * 60 * 60 * 1000);
            logger.debug(endDate);
            logger.debug(startDate);
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
                    logger.debug('the query collections is' + JSON.stringify(collection));
                    //logger.debug("query result is=" + JSON.stringify(result));
                }
                result.forEach(function (item) {
                    item.time = item._id.time;
                    delete item._id;
                });
                if (result.length == 0) {
                    result.push({time: startDate, count: 0});
                }
                insertToMongo(collection.s.name, result);
            });
        })
    });
}

function insertToMongo(name, data) {
    var collection = mongoDB.collection(dbName + name);
    collection.insert(data, function (err, result) {
        if (err) {
            console.log("insert mongo err:" + err);
            return;
        } else {
            if (global.debug == true) {
                //logger.debug(result);
            }
        }
    })
}

function getErrorCount(appid, startTime, endTime) {

    var collection = db.collection('count_badjslog_' + appid);
    var queryJson = {};
    queryJson.time = {$lt: endTime, $gt: startTime};
    collection.find(queryJson).toArray(function (err, result) {
        if (err) {
            console.log(err);
            return JSON.parse(err);
        }
        result.map(function (ele) {
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
    insertAuto: function () {
        setTimeout(function () {
            insertErrorCount();
        }, 60 * 1000)
    },
    getCount: function (appid, startTime, endTime) {
        getErrorCount(appid, startTime, endTime);
    }
}