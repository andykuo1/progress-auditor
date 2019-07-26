const UserDatabase = require('./UserDatabase.js');
const SubmissionDatabase = require('./SubmissionDatabase.js');
const ReviewDatabase = require('./ReviewDatabase.js');

function processReviews(db)
{
    // NOTE: Review types should only exist if it CANNOT be fixed in input data.
    // (Except student response data as that should be immutable).
    for(const reviewID of ReviewDatabase.getReviews(db))
    {
        const review = ReviewDatabase.getReviewByID(db, reviewID);
        const reviewType = review.type;
        const reviewParams = review.params;
        switch(reviewType)
        {
            case 'ignore_owner':
                SubmissionDatabase.clearSubmissionsByOwner(db, reviewParams[0]);
                break;
            case 'ignore_submission':
                const targetSubmission = SubmissionDatabase.getSubmissionByID(db, reviewParams[0]);
                if (!targetSubmission)
                {
                    error('[INVALID_REVIEW_PARAM] Submission for id is already removed.');
                    break;
                }

                const deleteSubmisssionIDs = [];
                for(const submissionID of SubmissionDatabase.getSubmissions(db))
                {
                    const submission = SubmissionDatabase.getSubmissionByID(db, submissionID);
                    if (submission.owner == targetSubmission.owner
                        && submission.attributes.content.id == targetSubmission.attributes.content.id)
                    {
                        deleteSubmisssionIDs.push(submissionID);
                    }
                }

                for(const submissionID of deleteSubmisssionIDs)
                {
                    SubmissionDatabase.removeSubmissionByID(db, submissionID);
                }
                break;
            case 'change_assignment':
                const submission = SubmissionDatabase.getSubmissionByID(db, reviewParams[1]);
                if (!submission)
                {
                    error('[INVALID_REVIEW_PARAM]', 'Unable to find submission for id.');
                    continue;
                }
                SubmissionDatabase.changeSubmissionAssignment(db, submission, reviewParams[0]);
                break;
            case 'add_owner_key':
                const user = UserDatabase.getUserByID(db, reviewParams[0]);
                if (!user)
                {
                    error('[INVALID_REVIEW_PARAM]', 'Unable to find user for id.');
                    continue;
                }
                if (Array.isArray(user.ownerKey))
                {
                    user.ownerKey.push(reviewParams[1]);
                    continue;
                }
                else
                {
                    user.ownerKey = [user.ownerKey, reviewParams[1]];
                    continue;
                }
            default:
                error('[UNKNOWN_REVIEW]', 'Unknown review type', reviewType);
        }
    }
}

module.exports = {
    processReviews
};