import * as SubmissionDatabase from '../database/SubmissionDatabase.js';

export async function review(db, reviewID, reviewType, reviewParams)
{
    SubmissionDatabase.clearSubmissionsByOwner(db, reviewParams[0]);
}
