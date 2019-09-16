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
                    db.throwError(ERROR_TAG, `Invalid review param - Cannot find submission for id '${params[0]}'.`, {
                        id: [id, type],
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
            })
            .review(db, config);
    }
    catch(e)
    {
        db.throwError(ERROR_TAG, e);
    }
}

export async function build()
{
    return await createBuilder()
        .type(TYPE)
        .param(0, 'Submission ID', 'The target submission id.')
        .build();
}
