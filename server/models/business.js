'use strict';
var _ = require('lodash');
module.exports = function (Business) {
  // validation
  Business.validatesInclusionOf('status', {
    in: ['pending', 'activated', 'deactivated']
  });
  Business.validatesPresenceOf('categoryId');

  // add ownerId to Business
  Business.beforeRemote('create', function (ctx, modelInstance, next) {
    if (!ctx.req.body.ownerId)
      ctx.req.body.ownerId = ctx.args.options.accessToken.userId;
    var name = ctx.req.body.nameEn.trim().replace(/ * /g, '.');

    // make unique name
    Business.count({
      nameUnique: {
        like: RegExp('^' + name + '[0-9]*')
      }
    }, function (err, count) {
      if (err)
        return next(err);

      ctx.req.body.nameUnique = name;
      if (count != 0)
        ctx.req.body.nameUnique = name + (count.toString())

      var tempId = 1;
      _.each(ctx.req.body.covers, (m) => {
        m.id = tempId++
      });
      var tempId = 1;
      _.each(ctx.req.body.products, (m) => {
        m.id = tempId++
      });

      next();
    });
  });

  Business.beforeRemote('replaceById', function (ctx, modelInstance, next) {
    if (!ctx.req.body.ownerId)
      ctx.req.body.ownerId = ctx.args.options.accessToken.userId
    var tempId = 1;
    _.each(ctx.req.body.covers, (m) => {
      m.id = tempId++
    });
    var tempId = 1;
    _.each(ctx.req.body.products, (m) => {
      m.id = tempId++
    });
    next();
  });

  // agree or reject Business
  Business.changeStatus = function (businessId, status, cb) {
    Business.findById(businessId.toString(), {}, function (err, business) {
      if (err)
        return cb(err);
      if (!business) {
        err = new Error('usiness not found');
        err.statusCode = 404;
        err.code = 'BUSINESS_NOT_FOUND';
        return cb(err);
      }
      business.status = (status) ? 'activated' : 'deactivated';
      business.save((err) => {
        if (err)
          return cb(err)
        return cb(null, business.status);
      })
    });
  }
  Business.remoteMethod('changeStatus', {
    description: 'agree or Reject business from admin',
    accepts: [{
        arg: 'businessId',
        type: 'string',
        required: true
      },
      {
        arg: 'agree',
        type: 'boolean',
        required: true,
        http: {
          source: 'body'
        }
      },
    ],
    returns: {
      arg: 'message',
      type: 'string'
    },
    http: {
      verb: 'post',
      path: '/:businessId/changeStatus'
    },
  });

  // to get busniess By nameUnique


  Business.afterRemote('findById', async function (ctx) {


    if (!ctx.result) {
      ctx.result = await Business.findOne({
        where: {
          nameUnique: ctx.args.id
        }
      });
    }

  });

  // execlude deleted entities 
  Business.observe('access', async function (ctx) {

    ctx.query = ctx.query || {};
    ctx.query.where = ctx.query.where || {};
    if (!ctx.query.where.deleted) {
      ctx.query.where.deleted = false;
    }
  });


  Business.once("attached", function () {


    Business.deleteById = async function (id, auth, cb) {


      let business = await Business.findById(id);
      if (!business)
        throw {
          message: "Resource not found",
          code: 404
        };


      business.updateAttribute("deleted", true);


      return "deleted";
    }


  });

  Business.searchByLocation = function (status, lat, lng, maxDistance, unit, keyword, catId, subCatId, codeCat, codeSubCat, openingDay, limit, skip, cityId, locationId, cb) {
    var where = {
      // status : 'activated'
    };

    if (lat != null)
      _.set(where, 'locationPoint.near.lat', lat);
    if (lng != null)
      _.set(where, 'locationPoint.near.lng', lng);
    if (maxDistance != null)
      _.set(where, 'locationPoint.maxDistance', maxDistance);
    if (unit)
      _.set(where, 'locationPoint.unit', unit);
    if (catId) where.categoryId = catId;
    if (subCatId) where.subCategoryId = subCatId;
    if (keyword)
      where.or = [{
          nameEn: {
            like: new RegExp('.*' + keyword + '.*', "i")
          }
        },
        {
          nameAr: {
            like: new RegExp('.*' + keyword + '.*', "i")
          }
        },
        {
          nameUnique: {
            like: new RegExp('.*' + keyword + '.*', "i")
          }
        },
        {
          description: {
            like: new RegExp('.*' + keyword + '.*', "i")
          }
        }
      ]
    if (openingDay) {
      where.openingDaysEnabled = true;
      where.openingDays = openingDay;
    }
    if (status) {
      where.status = status;
    }
    if (locationId) {
      where.locationId = locationId;
    }
    if (cityId) {
      where.cityId = cityId;
    }



    if ((lat != null && lng == null) || (lng != null && lat == null)) {
      var err = new Error('lat and lng both required');
      err.statusCode = 400;
      err.code = 'LATLNGREQUIRED';
      return cb(err);
    }

    if (lat && lat > 90) {
      var err = new Error('lat must be <= 90');
      err.statusCode = 400;
      err.code = 'LAT>90';
      return cb(err);
    }
    if (lng && lng > 180) {
      var err = new Error('lng must be <= 180');
      err.statusCode = 400;
      err.code = 'LNG>180';
      return cb(err);
    }

    getCategorybyCode(codeCat, (err, category) => {
      if (err)
        return cb(err);
      if (category) where.categoryId = category.id;

      getCategorybyCode(codeSubCat, (err, subCategory) => {
        if (err)
          return cb(err);
        if (subCategory) where.subCategoryId = subCategory.id;

        var query = {
          where: where
        };
        console.log(where)
        if (limit) query.limit = limit;
        if (skip) query.skip = skip;
        Business.find(query, function (err, business) {
          if (err)
            return cb(err);
          var vibBusiness = []
          var normalBusiness = []
          business.forEach(element => {
            if (element.vip)
              vibBusiness.push(element)
            else
              normalBusiness.push(element)
          });
          var allBusiness = vibBusiness.concat(normalBusiness)
          return cb(null, allBusiness)
          // return res.status(200).json(vibBusiness.concat(normalBusiness));
        });
      });
    });
  }
  Business.remoteMethod('searchByLocation', {
    // description: '',
    accepts: [{
        arg: 'status',
        type: 'string',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'lat',
        type: 'number',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'lng',
        type: 'number',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'maxDistance',
        type: 'number',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'unit',
        type: 'string',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'keyword',
        type: 'string',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'catId',
        type: 'string',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'subCatId',
        type: 'string',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'codeCat',
        type: 'string',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'codeSubCat',
        type: 'string',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'openingDay',
        type: 'number',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'limit',
        type: 'number',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'skip',
        type: 'number',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'cityId',
        type: 'string',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'locationId',
        type: 'string',
        http: {
          source: 'query'
        }
      }
    ],
    returns: [{
      "arg": "object",
      "type": "object",
      "root": true,
      "description": ""
    }],
    http: {
      verb: 'get',
      path: '/searchByLocation'
    },
  });




  Business.newSearchByLocation = function (status, lat, lng, maxDistance, unit, keyword, catId, subCatId, codeCat, codeSubCat, openingDay, limit, skip, cityId, locationId, cb) {

    var $match = {
      "$and": [{
        "deleted": false
      }]
    }
    var geometry = {
      $geoNear: {
        near: [null, null],
        key: "locationPointDB",
        distanceField: "distance",
        query: {
          deleted: false
        },
        spherical: true
      }
    }

    var categoryObj = {}
    var subcategoryObj = {}

    if (lat != null) {
      geometry['$geoNear']['near'][0] = lat
    }

    if (lng != null) {
      geometry['$geoNear']['near'][1] = lng

    }

    if (maxDistance != null) {
      geometry['$geoNear']['maxDistance'] = maxDistance * 1000 / (6371 * 1000)

    }
    if (catId) {
      categoryObj = {
        "categoryId": catId
      }
    }
    if (subCatId) {
      subcategoryObj = {
        "subCategoryId": subCatId
      }
    }

    if (keyword) {
      var orArray = [{
          nameEn: {
            $regex: keyword,
            $options: 'i'
          }
        },
        {
          nameAr: {
            $regex: keyword,
            $options: 'i'
          }
        },
        {
          nameUnique: {
            $regex: keyword,
            $options: 'i'
          }
        },
        {
          description: {
            $regex: keyword,
            $options: 'i'
          }
        }
      ]
      $match.$and.push({
        "$or": orArray
      })
    }

    if (openingDay) {
      $match.$and.push({
        "openingDaysEnabled": true
      })
      $match.$and.push({
        "openingDays": openingDay
      })
    }
    if (status) {
      $match.$and.push({
        "status": status
      })
    }
    if (locationId) {
      $match.$and.push({
        "locationId": locationId
      })
    }
    if (cityId) {
      $match.$and.push({
        "cityId": cityId
      })
    }



    if ((lat != null && lng == null) || (lng != null && lat == null)) {
      var err = new Error('lat and lng both required');
      err.statusCode = 400;
      err.code = 'LATLNGREQUIRED';
      return cb(err);
    }

    if (lat && lat > 90) {
      var err = new Error('lat must be <= 90');
      err.statusCode = 400;
      err.code = 'LAT>90';
      return cb(err);
    }
    if (lng && lng > 180) {
      var err = new Error('lng must be <= 180');
      err.statusCode = 400;
      err.code = 'LNG>180';
      return cb(err);
    }

    getCategorybyCode(codeCat, (err, category) => {
      if (err)
        return cb(err);
      if (category) {
        categoryObj = {
          "categoryId": category.id
        }
      }

      getCategorybyCode(codeSubCat, (err, subCategory) => {
        if (err)
          return cb(err);
        if (subCategory) {
          subcategoryObj = {
            "subCategoryId": subCategory.id
          }
        }

        if (categoryObj['categoryId'] != null)
          $match.$and.push(categoryObj)
        if (subcategoryObj['subCategoryId'] != null)
          $match.$and.push(subcategoryObj)

        var aggregateArray = []
        if (geometry.$geoNear.near[0] != null)
          aggregateArray.push(geometry)

        if ($match)
          aggregateArray.push({
            $match: $match
          })
        if (geometry.$geoNear.near[0] != null)
          aggregateArray.push({
            "$sort": {
              "distance": 1,
            }
          })
        aggregateArray.push({
          "$limit": limit
        }, {
          "$skip": skip
        })

        aggregateArray.push({
          $lookup: {
            from: "user",
            localField: "ownerId",
            foreignField: "_id",
            as: "owner"
          }
        }, {
          $unwind: "$owner"
        }, {
          $lookup: {
            from: "businessCategories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category"
          }
        }, {
          $unwind: "$category"
        }, {
          $lookup: {
            from: "businessCategories",
            localField: "subCategoryId",
            foreignField: "_id",
            as: "subCategory"
          }
        }, {
          $unwind: "$subCategory"
        }, {
          $lookup: {
            from: "cities",
            localField: "cityId",
            foreignField: "_id",
            as: "city"
          }
        }, {
          $unwind: "$city"
        }, {
          $lookup: {
            from: "locations",
            localField: "locationId",
            foreignField: "_id",
            as: "location"
          }
        }, {
          $unwind: "$location"
        }, {
          $project: {
            _id: 0,
            id: "$_id",
            vip: 1,
            nameEn: 1,
            nameAr: 1,
            nameUnique: 1,
            logo: 1,
            status: 1,
            description: 1,
            locationPoint: 1,
            locationPointDB: 1,
            phone1: 1,
            deleted: 1,
            openingDays: 1,
            openingDaysEnabled: 1,
            creationDate: 1,
            ownerId: 1,
            categoryId: 1,
            subCategoryId: 1,
            cityId: 1,
            locationId: 1,
            covers: 1,
            owner: 1,
            category: 1,
            subCategory: 1,
            city: 1,
            products: 1,
            location: 1,
            distance: 1,
          }
        })
        Business.getDataSource().connector.connect(function (err, db) {


          var collection = db.collection('business');
          var b = collection.aggregate(aggregateArray);
          b.get(function (err, business) {
            if (err) return cb(err);
            var vibBusiness = []
            var normalBusiness = []
            business.forEach(element => {
              if (element.vip)
                vibBusiness.push(element)
              else
                normalBusiness.push(element)
            });
            var allBusiness = vibBusiness.concat(normalBusiness)
            return cb(null, allBusiness)
          })
        });
      });
    });
  }
  Business.updateLocation = function () {
    Business.getDataSource().connector.connect(function (err, db) {
      var cust_to_clear = db.collection('business').aggregate()
      cust_to_clear.get(function (err, business) {
        business.forEach(
          function (x) {
            if (x.locationPoint) {
              db.collection('business').update({
                _id: x._id
              }, {
                $set: {
                  locationPointDB: [x.locationPoint.lat, x.locationPoint.lng]
                }
              });
            }
          }
        )
      })
    })
  }
  Business.remoteMethod('updateLocation', {
    http: {
      verb: 'get',
      path: '/updateLocation'
    }
  })
  Business.remoteMethod('newSearchByLocation', {
    // description: '',
    accepts: [{
        arg: 'status',
        type: 'string',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'lat',
        type: 'number',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'lng',
        type: 'number',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'maxDistance',
        type: 'number',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'unit',
        type: 'string',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'keyword',
        type: 'string',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'catId',
        type: 'string',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'subCatId',
        type: 'string',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'codeCat',
        type: 'string',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'codeSubCat',
        type: 'string',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'openingDay',
        type: 'number',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'limit',
        type: 'number',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'skip',
        type: 'number',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'cityId',
        type: 'string',
        http: {
          source: 'query'
        }
      },
      {
        arg: 'locationId',
        type: 'string',
        http: {
          source: 'query'
        }
      }
    ],
    returns: [{
      "arg": "object",
      "type": "object",
      "root": true,
      "description": ""
    }],
    http: {
      verb: 'get',
      path: '/newSearchByLocation'
    },
  });


  var getCategorybyCode = function (code, cb) {
    if (!code || code == 'default')
      return cb(null, null);
    return Business.app.models.businessCategories.findOne({
      where: {
        code: code
      }
    }, cb);
  }

  Business.addJobOpportunity = async function (businessId, categoryId, subCategoryId, nameEn, nameAr, descriptionEn, descriptionAr, rangeSalary, status = "pending", tags, minimumEducationLevel = null, jobType = null, responsibilitiesEn = null, responsibilitiesAr = null, qualificationsEn = null, qualificationsAr = null, ownerId = null, req, callback) {
    /* Todo permisions */
    if (nameEn == null && nameAr == null) {
      var err = new Error('name is required');
      err.statusCode = 400;
      err.code = 'NAMEREQUIRED';
      return callback(err);
    }
    let business = await Business.findById(businessId);
    if (!business)
      throw ERROR(404, "Business not found");

    var userId = req.accessToken.userId
    if (ownerId != null)
      userId = ownerId;
    var objectJob = {
      "ownerId": userId,
      "businessId": businessId,
      "nameEn": nameEn,
      "nameAr": nameAr,
      "descriptionEn": descriptionEn,
      "descriptionAr": descriptionAr,
      "rangeSalary": rangeSalary,
      "status": status,
      "categoryId": categoryId,
      "subCategoryId": subCategoryId,
      "minimumEducationLevel": minimumEducationLevel,
      "jobType": jobType,
      "responsibilitiesEn": responsibilitiesEn,
      "responsibilitiesAr": responsibilitiesAr,
      "qualificationsEn": qualificationsEn,
      "qualificationsAr": qualificationsAr
    }

    var jobOpp = await Business.app.models.jobOpportunities.create(objectJob);

    var mainTags = [];
    tags.forEach(element => {
      mainTags.push({
        "tagId": element,
        "jobId": jobOpp.id
      })
    });

    await Business.app.models.jobOpportunityTags.create(mainTags)
    var newJobOpp = await Business.app.models.jobOpportunities.findById(jobOpp.id)
    callback(null, newJobOpp)
  }

  Business.remoteMethod('addJobOpportunity', {
    description: '',
    accepts: [{
        arg: 'businessId',
        type: 'string',
        required: true,
        http: {
          "source": "path"
        }
      },
      {
        arg: "categoryId",
        type: "string",
        required: true,
        description: ""
      },
      {
        arg: "subCategoryId",
        type: "string",
        required: true,
        description: ""
      },
      {
        arg: "nameEn",
        type: "string",
        required: false,
        description: ""
      },
      {
        arg: "nameAr",
        type: "string",
        required: false,
        description: ""
      },
      {
        arg: "descriptionEn",
        type: "string",
        required: false,
        description: ""
      },
      {
        arg: "descriptionAr",
        type: "string",
        required: false,
        description: ""
      },
      {
        arg: "rangeSalary",
        type: "string",
        required: false,
        description: ""
      },
      {
        arg: "status",
        type: "string",
        required: false,
        description: ""
      },
      {
        arg: "tags",
        type: ["string"],
        required: true,
        description: ""
      },
      {
        "arg": "minimumEducationLevel",
        "type": "string",
        "required": false
      },
      {
        "arg": "jobType",
        "type": "string",
        "required": false
      },
      {
        "arg": "responsibilitiesEn",
        "type": "string",
        "required": false
      },
      {
        "arg": "responsibilitiesAr",
        "type": "string",
        "required": false
      },
      {
        "arg": "qualificationsEn",
        "type": "string",
        "required": false
      },
      {
        "arg": "qualificationsAr",
        "type": "string",
        "required": false
      },
      {
        "arg": "ownerId",
        "type": "string",
        "required": false
      },
      {
        "arg": "req",
        "type": "object",
        "required": true,
        "description": "",
        "http": {
          "source": "req"
        }
      }
    ],
    returns: {
      arg: 'message',
      type: 'string',
      root: true
    },
    http: {
      verb: 'post',
      path: '/:businessId/addJobOpportunity'
    },
  });

};
