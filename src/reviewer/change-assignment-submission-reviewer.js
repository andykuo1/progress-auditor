const SubmissionDatabase = require('../database/SubmissionDatabase.js');

async function review(db, reviewID, reviewType, reviewParams)
{
    const submission = SubmissionDatabase.getSubmissionByID(db, reviewParams[1]);
    if (!submission)
    {
        db.throwError('[INVALID_REVIEW_PARAM]', 'Unable to find submission for id.');
        return;
    }

    SubmissionDatabase.changeSubmissionAssignment(db, submission, reviewParams[0]);
}

module.exports = {
    review
};