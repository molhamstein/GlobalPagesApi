'use strict';
module.exports = async function (app) {


    let fs = require('fs');
    let _ = require('lodash');
    let exec = require('child_process').exec;
    let CronJob = require('cron').CronJob;
    let tar = require('tar');
    let path = require("path");

    let options = {

        sourcePath: "files/images/",
        backupPath: "../images-backup/"

    };

    async function imagesBackup() {

        console.log("images backup");
        let images = await fs.promises.readdir(options.sourcePath);

        images = images.map(image => path.join(options.sourcePath, image)); 
        tar.update({ file: "../images-backup/images-backup.tar.gz" },  images);
        
        console.log("Done images backup");


    }

    // every midnight 
    let job = new CronJob('* * * * * *', function () {
        imagesBackup();
        job.stop();
    }, null, true);

}; 