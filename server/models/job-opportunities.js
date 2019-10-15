'use strict';
var _ = require('lodash');
module.exports = function (Jobopportunity) {

  Jobopportunity.updateJobOpportunity = async function (id, categoryId, subCategoryId, nameEn, nameAr, descriptionEn, descriptionAr, rangeSalary, status, tags, callback) {
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
      "subCategoryId": subCategoryId
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
      }, {
        arg: "tags",
        type: ["string"],
        required: true,
        description: ""
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
};
