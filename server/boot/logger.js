'use strict';
module.exports = async function (app) {

    var rfs = require('rotating-file-stream');
    var path = require('path');

    var morganBody = require('morgan-body');



    // create a rotating write stream
    var accessLogStream = rfs('access.log', {
        compress: true,
        interval: '1d', // rotate daily
        path: path.join(__dirname, '../../../', 'log'),
        maxSize: '1G',
        size: '10M'
    })

    // setup the logger

    morganBody(app,
        {
            stream: accessLogStream,
            maxBodyLength: 1000000,
            logResponseBody: true,
            noColors: true,
            skip: (req, res) => {
                return !/login/gi.test(req.url); 
                // log if the request action is [POST , PUT , PATCH]
                let notSkip = ['POST', 'PUT', 'PATCH'].includes(req.method);
                // and if the response status was error and if 
                //notSkip &= res.statusCode  >= 400 ; 

                // and if the request was to one of the order routes 
                notSkip &= /order/gi.test(req.url);

                return !notSkip;
            }
        });


}; 