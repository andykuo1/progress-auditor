import * as SubmissionDatabase from '../../../database/SubmissionDatabase.js';

export const REVIEW_TYPE = 'change_assignment';
export const REVIEW_DESC = 'Change assignment for submission.';
export const REVIEW_PARAM_TYPES = [
    'Submission ID',
    'Assignment ID'
];

export async function review(db, reviewID, reviewType, reviewParams)
{
    if (reviewType !== REVIEW_TYPE) db.throwError(`Mismatched review type - '${REVIEW_TYPE}' reviewer cannot process review type '${reviewType}'.`);
    if (reviewParams.length < 2) db.throwError(`Missing review params - expected 2 parameters.`, { id: [reviewID, reviewType], options: [`Add more parameters to the review.`] });

    const submission = SubmissionDatabase.getSubmissionByID(db, reviewParams[1]);
    if (!submission)
    {
        db.throwError(`Invalid review param - unable to find submission for id '${reviewParams[1]}'.`, { id: [reviewID, reviewType], options: ['The submission for that id is missing from the database.', 'Or it\'s the wrong id.'] });
        return;
    }

    SubmissionDatabase.changeSubmissionAssignment(db, submission, reviewParams[0]);
}
