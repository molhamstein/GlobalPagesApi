'use strict';

module.exports = function(server) {
  // Install a `/` route that returns server status

   global.ERROR = function(statusCode,message,code){
  	var err = new Error(message);
  	err.statusCode = statusCode;
  	err.code = code || (message.replace(/ /g, '_').toUpperCase());
  	return err;
  }
  
  var router = server.loopback.Router();
  router.get('/', server.loopback.status());
  router.get('/api/settings',getSettings);
  server.use(router);

};


var getSettings = function(req,res,next){
  var settings = require('../apiSettings.json');
  return res.status(200).json(settings);
}
