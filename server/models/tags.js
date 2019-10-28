'use strict';
var _ = require('lodash');
module.exports = function (Tags) {
  Tags.addTag = async function (name, callback) {
    var tags = await Tags.find({
      "where": {
        "and": [{
          "name": {
            "like": name,
            "options": "i"
          }
        }]
      }
    });
    tags.forEach(element => {
      if (element.name.toLowerCase() == name.toLowerCase()) {
        callback(null, element);
      }
    });
    var newTag = await Tags.create({
      "name": name
    })
    callback(null, newTag);

  };


  Tags.remoteMethod('addTag', {
    description: '',
    accepts: [{
      arg: 'name',
      type: 'string',
      required: true
    }],
    returns: {
      arg: 'message',
      type: 'object',
      root: true
    },
    http: {
      verb: 'post',
      path: '/addTag'
    },
  });

};
