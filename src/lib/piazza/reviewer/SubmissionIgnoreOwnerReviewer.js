import * as SubmissionDatabase from '../../../database/SubmissionDatabase.js';

export const REVIEW_TYPE = 'ignore_owner';
export const REVIEW_DESC = 'Ignore submissions by owner.';
export const REVIEW_PARAM_TYPES = [
    'Owner Key'
];

export async function review(db, reviewID, reviewType, reviewParams)
{
    if (reviewType !== REVIEW_TYPE) db.throwError(`Mismatched review type - '${REVIEW_TYPE}' reviewer cannot process review type '${reviewType}'.`);
    if (reviewParams.length < 1) db.throwError(`Missing review params - expected 1 parameter.`, { id: [reviewID, reviewType], options: [`Add more parameters to the review.`] });

    SubmissionDatabase.clearSubmissionsByOwner(db, reviewParams[0]);
}
