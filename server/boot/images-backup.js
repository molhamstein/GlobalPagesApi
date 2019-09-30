'use strict';
module.exports = async function (app) {


    let fs = require('fs');
    let _ = require('lodash');
    let exec = require('child_process').exec;
    let CronJob = require('cron').CronJob;
    let tar = require('tar');
    let Path = require("path");
    let config = {

        sources: ["files/images", "files/thumb", "files/videos", "files/videos_thumb"],
        backupPath: "../backup/images-backup/"

    };

    function getFiles(source) {
        return fs.readdirSync(source).map(f => Path.join(source, f));
    }

    async function imagesBackup() {

        console.log("images backup on progress .. ");

        let files = config.sources.map(e => getFiles(e));
        files = _.flatten(files);
        let exists = [];
        let tarFile = Path.join(config.backupPath, "images-backup.tar.gz");

        if (fs.existsSync(tarFile)) {

            tar.list({
                sync: true,
                file: Path.join(config.backupPath, "images-backup.tar.gz"),
                onentry: entry => { exists.push(entry.path); }
            });
        }

        files = files.filter(e => !exists.find(ex => ex == e));
        if (files.length)
            await tar.replace({ file: tarFile }, files);

        console.log("Done images backup");


    }

    // every midnight   
    let job = new CronJob('0 0 0 * * *', function () {
        imagesBackup();
    }, null, true);

}; 