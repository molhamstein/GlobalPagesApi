'use strict';
var ObjectId = require('mongodb').ObjectID;

module.exports = function (Jobopportunityuser) {

  Jobopportunityuser.validatesInclusionOf('status', {
    in: ['pending', 'interviewing', 'hire', 'noHire']
  });
  Jobopportunityuser.applyJobOpportunity = async function (jobId, req, callback) {
    var userId = req.accessToken.userId;
    var job = await Jobopportunityuser.app.models.jobOpportunities.findById(jobId);
    if (job == null) {
      var err = new Error('Job Opportunity not found');
      err.statusCode = 404;
      err.code = 'JOB_OPPORTUNITY_NOT_FOUND';
      return callback(err);
    }

    var oldUserInJob = await Jobopportunityuser.findOne({
      "where": {
        "jobId": jobId,
        "userId": userId
      }
    })

    if (oldUserInJob != null) {
      var err = new Error('You are already apply to Job Opportunity');
      err.statusCode = 600;
      err.code = 'YOU_ARE_ALREADY_APPLY_TO_JOB_OPPORTUNITY';
      return callback(err);
    }

    var newUserInJob = await Jobopportunityuser.create({
      "jobId": new ObjectId(jobId),
      "userId": userId
    })
    var newNumber = job.NumberOfApplicants + 1
    await job.updateAttribute("NumberOfApplicants", newNumber);
    callback(null, newUserInJob)
  }

  Jobopportunityuser.remoteMethod('applyJobOpportunity', {
    description: '',
    accepts: [{
        arg: 'jobId',
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
      type: 'string',
      root: true
    },
    http: {
      verb: 'post',
      path: '/:jobId/applyJobOpportunity'
    },
  });


  Jobopportunityuser.changeStatus = async function (id, newStatus, callback) {
    var userJob = await Jobopportunityuser.findById(id);
    if (userJob == null) {
      var err = new Error('User Job not found');
      err.statusCode = 404;
      err.code = 'USER_JOB_NOT_FOUND';
      return callback(err);
    }

    userJob = await userJob.updateAttribute("status", newStatus)
    userJob = await Jobopportunityuser.findById(id);

    callback(null, userJob)
  }


  Jobopportunityuser.remoteMethod('changeStatus', {
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
        arg: "newStatus",
        type: "string",
        required: true,
        description: ""
      }
    ],
    returns: {
      arg: 'message',
      type: 'string',
      root: true
    },
    http: {
      verb: 'put',
      path: '/:id/changeStatus'
    },
  });

};
