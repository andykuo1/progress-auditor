import * as SubmissionDatabase from '../../database/SubmissionDatabase.js';

import { createReviewer } from '../helper/Reviewer.js';
import { createBuilder } from '../helper/ReviewBuilder.js';

const ERROR_TAG = 'REVIEW';

export const TYPE = 'ignore_submission';
export const DESCRIPTION = 'Ignore specific submission by id.';

export async function review(db, config)
{
    try
    {
        await createReviewer()
            .type(TYPE)
            .paramLength(1)
            .forEach(value =>
            {
                const { id, type, params } = value;
                const targetSubmission = SubmissionDatabase.getSubmissionByID(db, params[0]);
                if (!targetSubmission)
                {
                    console.log("...Ignoring redundant review for missing submission...");
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
            })
            .review(db, config);
    }
    catch(e)
    {
        db.throwError(ERROR_TAG, e);
    }
}

export async function build(errors = [])
{
    const result = [];
    for(const error of errors)
    {
        result.push(await buildStep(error));
    }
    return result;
}

async function buildStep(error)
{
    return await createBuilder()
        .type(TYPE)
        .param(0, 'Submission ID', 'The target submission id.', error.context.submissionID || '')
        .build();
}
