const SubmissionDatabase = require('../database/SubmissionDatabase.js');

async function review(db, reviewID, reviewType, reviewParams)
{
    SubmissionDatabase.clearSubmissionsByOwner(db, reviewParams[0]);
}

module.exports = {
    review
};