import * as SubmissionDatabase from '../../../database/SubmissionDatabase.js';

export const REVIEW_ID = 'change_assignment';

export async function review(db, reviewID, reviewType, reviewParams)
{
    const submission = SubmissionDatabase.getSubmissionByID(db, reviewParams[1]);
    if (!submission)
    {
        db.throwError(`[INVALID_REVIEW_PARAM] Unable to find submission for id '${reviewParams[1]}'.`);
        return;
    }

    SubmissionDatabase.changeSubmissionAssignment(db, submission, reviewParams[0]);
}
