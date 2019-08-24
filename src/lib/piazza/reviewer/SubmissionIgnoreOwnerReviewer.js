import * as SubmissionDatabase from '../../../database/SubmissionDatabase.js';

export const REVIEW_ID = 'ignore_owner';

export async function review(db, reviewID, reviewType, reviewParams)
{
    SubmissionDatabase.clearSubmissionsByOwner(db, reviewParams[0]);
}
