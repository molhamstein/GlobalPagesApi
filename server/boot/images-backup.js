'use strict';
module.exports = async function (app) {


    let fs = require('fs');
    let _ = require('lodash');
    let exec = require('child_process').exec;
    let CronJob = require('cron').CronJob;
    let tar = require('tar');
    let path = require("path");

    let options = {

        sourcePath: "files/",
        backupPath: "../backup/images-backup/"

    };

    async function imagesBackup() {

        console.log("media backup");

        await tar.update({ file: path.join(options.backupPath ,  "images-backup.tar.gz") },  [options.sourcePath]);
        
        console.log("Done images backup");


    }

    // every midnight 
    let job = new CronJob('* * * * * *', function () {
        imagesBackup();
        job.stop(); 
    }, null, true);

}; 