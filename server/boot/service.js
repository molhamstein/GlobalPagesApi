'use strict';
var myConfig = require('../myConfig');

const urlFileRootSave = myConfig.host + "/images/";

module.exports = {
    downloadImage: function (image) {
        return new Promise(function (resolve, reject) {
            const download = require('image-downloader')
            const parts = image.split('.');
            var extension = "jpg"
            var newFilename = (new Date()).getTime() + '.' + extension;

            const options = {
                url: image,
                dest: 'files/images/' + newFilename
            }
            download.image(options)
                .then(({ filename, image }) => {
                    let imageUrl = urlFileRootSave + newFilename;
                    resolve(imageUrl)
                })
                .catch((err) => reject(err))
        })
    }
}
