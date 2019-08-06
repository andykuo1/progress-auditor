const ReviewManager = require('./ReviewManager.js');
const SubmissionDatabase = require('../database/SubmissionDatabase.js');

const REVIEW_TYPE = 'ignore_owner';

async function process(db, reviewID, reviewType, reviewParams)
{
    SubmissionDatabase.clearSubmissionsByOwner(db, reviewParams[0]);
}

ReviewManager.register(REVIEW_TYPE, process);