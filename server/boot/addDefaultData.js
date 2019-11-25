'use strict';

module.exports = function addDefaultData(server) {
  addDefaultBusinessCategories();


  function addDefaultBusinessCategories() {
    // server.models.businessCategories.findOrCreate({where : {code : 'medicine'}},{
    // 	code : "medicine", 
    // 	titleAr : "طب",
    // 	titleEn : "medicine",
    // },function(err,medicine){
    // 	if(err)
    // 		return console.log(err);
    // server.models.businessCategories.findOrCreate({
    //   where: {
    //     code: 'pharmacies'
    //   }
    // }, {
    //   code: "pharmacies",
    //   titleAr: "صيدليات",
    //   titleEn: "pharmacies",
    //   parentCategoryId: medicine.id
    // }, function (err, pharmacies) {
    //   if (err)
    //     return console.log(err);
    // });
    // });
  }
};
