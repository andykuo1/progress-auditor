const ERROR_TAG = 'REVIEW';

export const REVIEW_TYPE = '__temp__';
export const REVIEW_DESC = 'Temporary review.';
export const REVIEW_PARAM_TYPES = [
    'Error ID'
];

export async function review(db, config, reviewID, reviewType, reviewParams)
{
    if (reviewType !== REVIEW_TYPE) db.throwError(ERROR_TAG, `Mismatched review type - '${REVIEW_TYPE}' reviewer cannot process review type '${reviewType}'.`);
    if (reviewParams.length < 1) db.throwError(ERROR_TAG, `Missing review params - expected 1 parameter.`, { id: [reviewID, reviewType], options: [`Add more parameters to the review.`] });

    db.removeErrorByID(reviewParams[0]);
}
