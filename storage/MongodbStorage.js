/**
 * Created by chriscai on 2014/10/14.
 */

var MongoClient = require('mongodb').MongoClient,
    map = require('map-stream');

var log4js = require('log4js'),
    logger = log4js.getLogger();

var cacheTotal = require('../service/cacheTotal');

var mongoDB, adminMongoDB;


var hadCreatedCollection = {};

var tryInit = function (db , collectionName , cb){
    if(hadCreatedCollection[collectionName] === 'ping'){
        return ;
    }
    if (hadCreatedCollection[collectionName] === true){
        var collection = db.collection(collectionName);
        cb(null , collection);
        return true;
    }

    hadCreatedCollection[collectionName] = "ping";
    db.createCollection(collectionName , function (err , collection){
        collection.indexExists('date_-1_level_1' , function (errForIE , result ){
            if(errForIE){
                throw errForIE;
            }
            if(!result){
                collection.createIndex( {date : -1 , level : 1 } , function (errForCI){
                    if(errForCI){
                        throw errForCI;
                    }
                    if (global.MONGODB.isShard){
                        adminMongoDB.command({
                            shardcollection: "badjs." + collectionName,
                            key: {_id: "hashed"}
                        }, function (errForShard, info) {
                            if (errForShard) {
                                throw errForShard;
                            } else {
                                logger.info(collectionName + " shard correctly");
                                cb(null , collection);
                                hadCreatedCollection[collectionName] = true;

                            }
                        });
                    }else {
                        cb(null , collection);
                        hadCreatedCollection[collectionName] = true;
                    }

                });
            }else {
                cb(null , collection);
                hadCreatedCollection[collectionName] = true;
            }
        })
    } )
};

//var insertDocuments = function(db , model) {
//    var collectionName = 'badjslog_' + model.id;
//    var collection = db.collection(collectionName);
//    collection.insert([
//        model.model
//    ] , function (err , result){
//        if (hadCreatedCollection[collectionName]) {
//            return ;
//        }
//        collection.indexExists('date_-1_level_1' , function (err , result ){
//            if(!result){
//                collection.createIndex( {date : -1 , level : 1 } , function (err , result){
//
//                });
//            }
//            hadCreatedCollection[collectionName] = true;
//        })
//    });
//
//    logger.debug("save one log : " + JSON.stringify(model.model));
//}

var insertDocuments = function(db , model) {
    var collectionName = 'badjslog_' + model.id;

    tryInit(db ,collectionName , function (err , collection ){
        collection.insert([
            model.model
        ] , function (err , result){
            if( global.debug){
                logger.debug("save one log : " + JSON.stringify(model.model));
            }
        });
    });
};


// shard new collection when created
var shardCollection = function (db, collection, collectionName) {
    collection.createIndex({_id: "hashed"}, function (err, result) {
        if (err) {
            logger.info("failed to create hashed index");
        } else {
            logger.info("hashed index created");

            var adminDb = db.admin();
            if (global.MONGO_ADMIN_USER && global.MONGO_ADMIN_PASSWORD) {
                adminDb.authenticate(global.MONGO_ADMIN_USER, global.MONGO_ADMIN_PASSWORD, function (err, result) {
                    if (err) {
                        logger.info("failed to access adminDB");
                    } else {
                        adminDb.command({
                            shardcollection: "badjs." + collectionName,
                            key: {_id: "hashed"}
                        }, function (err, info) {
                            if (err) {
                                logger.info("failed to shardcollection " + collectionName);
                            } else {
                                logger.info(collectionName + " shard correctly");
                            }
                        });
                    }
                });
            }
        }
    });
};

// Use connect method to connect to the Server
MongoClient.connect(global.MONGODB.url, function(err, db) {
    if(err){
        logger.info("failed connect to server");
    }else {
        logger.info("Connected correctly to server");
    }
    mongoDB = db;
});


MongoClient.connect(global.MONGODB.adminUrl, function(err, db) {
    if(err){
        logger.info("failed connect to server use admin admin");
    }else {
        logger.info("Connected  correctly to server use admin");
    }
    adminMongoDB = db;
});

module.exports = function (){
   return map(function (data) {
       try{
        var dataStr = data.toString();
        data = JSON.parse(dataStr.substring(dataStr.indexOf(' ')));
       }catch (e){
           logger.error('parse error');
           return ;
       }

       if(!data.id ){
           logger.info('not id data');
            return ;
       }

       if(!mongoDB ){dataStr.substring(dataStr.indexOf(' '))
           logger.info('cannot connect mongodb');
           return ;
       }
       var id = data.id;
       delete data.id;

       var all = '';
       for(var key in data ) {
            all += ';'+key+'=' + data[key];
       }
       data.all = all;
       data.date = new Date(data.date);


       insertDocuments(mongoDB , {id : id,
           model : data
       });

       if(data.level == 4){
           cacheTotal.increase( {id : id });
           logger.debug("cache total id : " + id);
       }

    });
}