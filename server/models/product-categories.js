'use strict';


module.exports = function (Productcategories) {
  // Adcategories.validatesPresenceOf('parentCategoryId');
  Productcategories.getChildCategory = function (categoryId, cb) {
    Productcategories.find({
      where: {
        parentCategoryId: categoryId
      }
    }, {}, cb);
  }

  Productcategories.remoteMethod('getChildCategory', {
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



  Productcategories.once("attached", function () {


    Productcategories.deleteById = async function (id, auth, cb) {


      let category = await Productcategories.findById(id);
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
      for (let business of await Productcategories.app.models.business.find({
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
  Productcategories.observe('access', async function (ctx) {

    ctx.query = ctx.query || {};
    ctx.query.where = ctx.query.where || {};
    if (!ctx.query.where.deleted) {
      ctx.query.where.deleted = false;
    }
  });

};
