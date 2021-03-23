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
    },
    addHourse: function (hourse, date) {
        let newDate = new Date();
        if (date != null) {
            newDate = new Date(date)
        }
        newDate.setTime(newDate.getTime() + (hourse * 60 * 60 * 1000));
        return newDate;
    },
    makeCode: function (length, isJustNumber = false) {
        var result = '';
        var characters = isJustNumber ? "123456789" : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
}
