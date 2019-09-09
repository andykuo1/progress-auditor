import * as SubmissionDatabase from '../../../database/SubmissionDatabase.js';
import * as ParseUtil from '../../../util/ParseUtil.js';

const ERROR_TAG = 'REVIEW';

export const REVIEW_TYPE = 'change_submission_date';
export const REVIEW_DESC = 'Change date for submission.';
export const REVIEW_PARAM_TYPES = [
    'Submission ID',
    'Submission Date'
];

export async function review(db, config, reviewID, reviewType, reviewParams)
{
    if (reviewType !== REVIEW_TYPE) db.throwError(ERROR_TAG, `Mismatched review type - '${REVIEW_TYPE}' reviewer cannot process review type '${reviewType}'.`);
    if (reviewParams.length < 2) db.throwError(ERROR_TAG, `Missing review params - expected 2 parameters.`, { id: [reviewID, reviewType], options: [`Add more parameters to the review.`] });

    const submission = SubmissionDatabase.getSubmissionByID(db, reviewParams[0]);
    if (!submission)
    {
        db.throwError(ERROR_TAG, `Invalid review param - unable to find submission for id '${reviewParams[0]}'.`, {
            id: [reviewID, reviewType],
            options: [
                'The submission for that id is missing from the database.',
                'Or it\'s the wrong id.'
            ]
        });
        return;
    }

    submission.date = ParseUtil.parseDate(reviewParams[1]);
}
