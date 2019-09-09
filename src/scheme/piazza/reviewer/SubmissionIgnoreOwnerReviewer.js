import * as SubmissionDatabase from '../../../database/SubmissionDatabase.js';

const ERROR_TAG = 'REVIEW';

export const REVIEW_TYPE = 'ignore_owner';
export const REVIEW_DESC = 'Ignore submissions by owner.';
export const REVIEW_PARAM_TYPES = [
    'Owner Key'
];

export async function review(db, config, reviewID, reviewType, reviewParams)
{
    if (reviewType !== REVIEW_TYPE) db.throwError(ERROR_TAG, `Mismatched review type - '${REVIEW_TYPE}' reviewer cannot process review type '${reviewType}'.`);
    if (reviewParams.length < 1) db.throwError(ERROR_TAG, `Missing review params - expected 1 parameter.`, { id: [reviewID, reviewType], options: [`Add more parameters to the review.`] });

    SubmissionDatabase.clearSubmissionsByOwner(db, reviewParams[0]);
}
