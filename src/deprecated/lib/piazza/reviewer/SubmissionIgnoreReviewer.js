import * as SubmissionDatabase from '../../../database/SubmissionDatabase.js';

const ERROR_TAG = 'REVIEW';

export const REVIEW_TYPE = 'ignore_submission';
export const REVIEW_DESC = 'Ignore specific submission by id.';
export const REVIEW_PARAM_TYPES = [
    'Submission ID'
];

export async function review(db, reviewID, reviewType, reviewParams)
{
    if (reviewType !== REVIEW_TYPE) db.throwError(ERROR_TAG, `Mismatched review type - '${REVIEW_TYPE}' reviewer cannot process review type '${reviewType}'.`);
    if (reviewParams.length < 1) db.throwError(ERROR_TAG, `Missing review params - expected 1 parameter.`, { id: [reviewID, reviewType], options: [`Add more parameters to the review.`] });

    const targetSubmission = SubmissionDatabase.getSubmissionByID(db, reviewParams[0]);
    if (!targetSubmission)
    {
        db.throwError(ERROR_TAG, `Invalid review param - Cannot find submission for id '${reviewParams[0]}'.`, {
            id: [reviewID, reviewType],
            options: [
                `Submission with this id has probably already been removed.`,
                `Or the id is wrong.`
            ]
        });
        return;
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
}
