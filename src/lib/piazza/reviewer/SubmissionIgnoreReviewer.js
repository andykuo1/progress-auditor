import * as SubmissionDatabase from '../../../database/SubmissionDatabase.js';

export const REVIEW_TYPE = 'ignore_submission';
export const REVIEW_DESC = 'Ignore specific submission by id.';
export const REVIEW_PARAM_TYPES = [
    'Submission ID'
];

export async function review(db, reviewID, reviewType, reviewParams)
{
    const targetSubmission = SubmissionDatabase.getSubmissionByID(db, reviewParams[0]);
    if (!targetSubmission)
    {
        db.throwError(`[INVALID_REVIEW_PARAM] Submission for id '${reviewParams[0]}' has already been removed.`);
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
