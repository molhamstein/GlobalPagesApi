'use strict';


module.exports = function (Jobopportunitycategories) {
  // Adcategories.validatesPresenceOf('parentCategoryId');
  Jobopportunitycategories.getChildCategory = function (categoryId, cb) {
    Jobopportunitycategories.find({
      where: {
        parentCategoryId: categoryId
      }
    }, {}, cb);
  }

  Jobopportunitycategories.remoteMethod('getChildCategory', {
    description: 'get All Cild category Ids  for category',
    accepts: [{
      arg: 'categoryId',
      type: 'string',
      required: true
    }, ],
    returns: {
      arg: 'data',
      root: true,
      type: 'array'
    },
    http: {
      verb: 'get',
      path: '/:categoryId/children'
    },
  });



  Jobopportunitycategories.once("attached", function () {


    Jobopportunitycategories.deleteById = async function (id, auth, cb) {


      let category = await Jobopportunitycategories.findById(id);
      if (!category)
        throw {
          message: "Resource not found",
          code: 404
        };


      // delete subCategory
      for (let subCategory of await category.subCategories.find()) {
        subCategory.updateAttribute("deleted", true);
      }
      // delete businesses
      for (let business of await Jobopportunitycategories.app.models.business.find({
          where: {
            or: [{
              categoryId: id
            }, {
              subCategoryId: id
            }]
          }
        })) {
        business.updateAttribute("deleted", true);
      }
      //delete self
      category.updateAttribute("deleted", true);



      return "deleted";
    }


  });



  // execlude deleted entities 
  Jobopportunitycategories.observe('access', async function (ctx) {

    ctx.query = ctx.query || {};
    ctx.query.where = ctx.query.where || {};
    if (!ctx.query.where.deleted) {
      ctx.query.where.deleted = false;
    }
  });

};
