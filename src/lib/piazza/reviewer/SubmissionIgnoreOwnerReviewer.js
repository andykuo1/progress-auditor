import * as SubmissionDatabase from '../../../database/SubmissionDatabase.js';

export const REVIEW_TYPE = 'ignore_owner';
export const REVIEW_DESC = 'Ignore submissions by owner.';
export const REVIEW_PARAM_TYPES = [
    'Owner Key'
];

export async function review(db, reviewID, reviewType, reviewParams)
{
    SubmissionDatabase.clearSubmissionsByOwner(db, reviewParams[0]);
}
