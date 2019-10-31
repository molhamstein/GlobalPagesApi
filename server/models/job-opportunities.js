'use strict';
var _ = require('lodash');
var ObjectId = require('mongodb').ObjectID;

module.exports = function (Jobopportunity) {

  Jobopportunity.updateJobOpportunity = async function (id, categoryId, subCategoryId, nameEn, nameAr, descriptionEn, descriptionAr, rangeSalary, status, tags, minimumEducationLevel, jobType, responsibilitiesEn, responsibilitiesAr, qualificationsEn, qualificationsAr, callback) {
    var job = await Jobopportunity.findById(id);
    if (job == null) {
      var err = new Error('Job Opportunity not found');
      err.statusCode = 404;
      err.code = 'JOB_OPPORTUNITY_NOT_FOUND';
      return callback(err);
    }
    await Jobopportunity.app.models.jobOpportunityTags.destroyAll({
      "jobId": id
    })

    var mainTags = [];
    tags.forEach(element => {
      mainTags.push({
        "tagId": element,
        "jobId": id
      })
    });

    await Jobopportunity.app.models.jobOpportunityTags.create(mainTags)
    job = await job.updateAttributes({
      "nameEn": nameEn,
      "nameAr": nameAr,
      "descriptionEn": descriptionEn,
      "descriptionAr": descriptionAr,
      "rangeSalary": rangeSalary,
      "status": status || job.status,
      "categoryId": categoryId,
      "subCategoryId": subCategoryId,
      "minimumEducationLevel": minimumEducationLevel,
      "jobType": jobType,
      "responsibilitiesEn": responsibilitiesEn,
      "responsibilitiesAr": responsibilitiesAr,
      "qualificationsEn": qualificationsEn,
      "qualificationsAr": qualificationsAr
    })
    job = await Jobopportunity.findById(id);
    callback(null, job);
  };


  Jobopportunity.remoteMethod('updateJobOpportunity', {
    description: '',
    accepts: [{
        arg: 'id',
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
        required: true,
        description: ""
      },
      {
        arg: "nameAr",
        type: "string",
        required: true,
        description: ""
      },
      {
        arg: "descriptionEn",
        type: "string",
        required: true,
        description: ""
      },
      {
        arg: "descriptionAr",
        type: "string",
        required: true,
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
      }
    ],
    returns: {
      arg: 'message',
      type: 'object',
      root: true
    },
    http: {
      verb: 'put',
      path: '/:id/updateJobOpportunity'
    },
  });


  Jobopportunity.employee = async function (id, callback) {
    var users = await Jobopportunity.app.models.jobOpportunityUser.find({
      "where": {
        "jobId": id
      },
      "include": {
        relation: 'user', // include the owner object
        scope: { // further filter the owner object
          include: { // include orders for the owner
            relation: 'CV',
          }
        }
      }
    })
    callback(null, users);
  };


  Jobopportunity.remoteMethod('employee', {
    description: '',
    accepts: [{
      arg: 'id',
      type: 'string',
      required: true,
      http: {
        "source": "path"
      }
    }],
    returns: {
      arg: 'message',
      type: 'array',
      root: true
    },
    http: {
      verb: 'get',
      path: '/:id/employee'
    },
  });



  Jobopportunity.getJobOpportunity = async function (id, req, callback) {
    var job = await Jobopportunity.findById(id);
    if (req.accessToken && req.accessToken.userId) {
      var userId = req.accessToken.userId
      var userIsApplied = await Jobopportunity.app.models.jobOpportunityUser.findOne({
        "where": {
          "userId": userId,
          "jobId": id
        }
      })

      if (userIsApplied)
        job.userIsApplied = true
      else
        job.userIsApplied = false

    }
    callback(null, job)
  };


  Jobopportunity.remoteMethod('getJobOpportunity', {
    description: '',
    accepts: [{
        arg: 'id',
        type: 'string',
        required: true,
        http: {
          "source": "path"
        }
      },
      {
        arg: "req",
        type: "object",
        required: true,
        description: "",
        "http": {
          "source": "req"
        }
      }
    ],
    returns: {
      arg: 'message',
      type: 'array',
      root: true
    },
    http: {
      verb: 'get',
      path: '/:id/getJobOpportunity'
    },
  });



  Jobopportunity.searchJob = function (categoryId, subCategoryId, cityId, keyword, status, offset = 0, limit = 5, callback) {
    var filter = {}
    filter['$and'] = []
    if (status != null)
      filter['$and'].push({
        'status': status
      })
    if (categoryId != null)
      filter['$and'].push({
        'categoryId': ObjectId(categoryId)
      })
    if (subCategoryId != null)
      filter['$and'].push({
        'subCategoryId': ObjectId(subCategoryId)
      })
    if (cityId != null)
      filter['$and'].push({
        'business.cityId': ObjectId(cityId)
      })

    if (keyword != null) {
      filter['$and'].push({
        "$or": [{
          nameAr: {
            $regex: keyword,
            $options: 'i'
          }
        }, {
          nameEn: {
            $regex: keyword,
            $options: 'i'
          }
        }, {
          descriptionAr: {
            $regex: keyword,
            $options: 'i'
          }
        }, {
          descriptionEn: {
            $regex: keyword,
            $options: 'i'
          }
        }]
      })
    }

    if (filter["$and"].length == 0) {
      filter = {}
    }
    Jobopportunity.getDataSource().connector.connect(function (err, db) {

      var collection = db.collection('jobOpportunities');
      var cursor = collection.aggregate([{
          $lookup: {
            from: "user",
            localField: "ownerId",
            foreignField: "_id",
            as: "owner"
          },
        },
        {
          $lookup: {
            from: "business",
            "let": {
              "id": "$businessId"
            },
            pipeline: [{
                "$match": {
                  "$expr": {
                    "$eq": ["$_id", "$$id"]
                  }
                }
              },
              {
                "$project": {
                  "_id": 0,
                  'id': '$_id',
                  'nameEn': 1,
                  'nameAr': 1,
                  'nameUnique': 1,
                  'logo': 1,
                  'status': 1,
                  'description': 1,
                  'covers': 1,
                  'locationPoint': 1,
                  'phone1': 1,
                  'fax': 1,
                  'address': 1,
                  'deleted': 1,
                  'cityId': 1,
                  'locationId': 1
                }
              }
            ],
            as: "business"
          },
        },
        {
          $unwind: "$business"
        },
        {
          $lookup: {
            from: "cities",
            "let": {
              "id": "$business.cityId"
            },
            pipeline: [{
                "$match": {
                  "$expr": {
                    "$eq": ["$_id", "$$id"]
                  }
                }
              },
              {
                "$project": {
                  "_id": 0,
                  'id': '$_id',
                  'nameEn': 1,
                  'nameAr': 1,
                  'deleted': 1
                }
              }
            ],
            as: "business.city"
          },
        },
        {
          $unwind: "$business.city"
        },
        {
          $lookup: {
            from: "locations",
            "let": {
              "id": "$business.locationId"
            },
            pipeline: [{
                "$match": {
                  "$expr": {
                    "$eq": ["$_id", "$$id"]
                  }
                }
              },
              {
                "$project": {
                  "_id": 0,
                  'id': '$_id',
                  'nameEn': 1,
                  'nameAr': 1,
                  'deleted': 1
                }
              }
            ],
            as: "business.location"
          },
        },
        {
          $unwind: "$business.location"
        },
        {
          $lookup: {
            from: "jobOpportunityCategories",
            "let": {
              "id": "$subCategoryId"
            },
            pipeline: [{
                "$match": {
                  "$expr": {
                    "$eq": ["$_id", "$$id"]
                  }
                }
              },
              {
                "$project": {
                  "_id": 0,
                  'id': '$_id',
                  'titleAr': 1,
                  'titleEn': 1,
                  'creationDate': 1,
                  'deleted': 1,
                  'parentCategoryId': 1
                }
              }
            ],
            as: "subCategory"
          },
        },
        {
          $lookup: {
            from: "jobOpportunityCategories",
            "let": {
              "id": "$categoryId"
            },
            pipeline: [{
                "$match": {
                  "$expr": {
                    "$eq": ["$_id", "$$id"]
                  }
                }
              },
              {
                "$project": {
                  "_id": 0,
                  'id': '$_id',
                  'titleAr': 1,
                  'titleEn': 1,
                  'creationDate': 1,
                  'deleted': 1,
                }
              }
            ],
            as: "category"
          },
        },
        {
          $unwind: "$owner"
        },
        {
          $unwind: "$category"
        },
        {
          $unwind: "$subCategory"
        },
        {
          $match: filter
        },
        {
          $sort: {
            creationDate: -1
          }
        },
        {
          $limit: limit
        },
        {
          $skip: offset
        },
        {
          $project: {
            _id: 0,
            'id': '$_id',
            nameEn: 1,
            nameAr: 1,
            descriptionAr: 1,
            descriptionEn: 1,
            minimumEducationLevel: 1,
            jobType: 1,
            qualificationsEn: 1,
            qualificationsAr: 1,
            responsibilitiesAr: 1,
            responsibilitiesEn: 1,
            rangeSalary: 1,
            businessId: 1,
            status: 1,
            categoryId: 1,
            subCategoryId: 1,
            creationDate: 1,
            ownerId: 1,
            category: 1,
            subCategory: 1,
            business: 1,


          }
        }
      ]);
      cursor.get(function (err, data) {
        if (err) return callback(err);
        return callback(null, data);
      })
    });
  };


  Jobopportunity.remoteMethod('searchJob', {
    description: '',
    accepts: [{
        arg: "categoryId",
        type: "string",
        required: false,
        description: ""
      },
      {
        arg: "subCategoryId",
        type: "string",
        required: false,
        description: ""
      },
      {
        arg: "cityId",
        type: "string",
        required: false,
        description: ""
      },
      {
        arg: "keyword",
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
        arg: "offset",
        type: "number",
        required: false,
        description: ""
      },
      {
        arg: "limit",
        type: "number",
        required: false,
        description: ""
      },
    ],
    returns: {
      arg: 'message',
      type: 'object',
      root: true
    },
    http: {
      verb: 'get',
      path: '/searchJob'
    },
  });


};
