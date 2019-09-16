import * as SubmissionDatabase from '../../database/SubmissionDatabase.js';
import * as AssignmentDatabase from '../../database/AssignmentDatabase.js';

import { createReviewer } from '../helper/Reviewer.js';
import { createBuilder } from '../helper/ReviewBuilder.js';

const ERROR_TAG = 'REVIEW';

export const TYPE = 'change_assignment';
export const DESCRIPTION = 'Change assignment for submission.';

export async function review(db, config)
{
    try
    {
        await createReviewer()
            .type(TYPE)
            .paramLength(2)
            .forEach(value =>
            {
                const { id, type, params } = value;
                const submission = SubmissionDatabase.getSubmissionByID(db, params[1]);
                if (!submission)
                {
                    db.throwError(ERROR_TAG, `Invalid review param - unable to find submission for id '${params[1]}'.`, {
                        id: [id, type],
                        options: [
                            'The submission for that id is missing from the database.',
                            'Or it\'s the wrong id.'
                        ]
                    });
                    return;
                }

                SubmissionDatabase.changeSubmissionAssignment(db, submission, params[0]);
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
        .param(0, 'Assignment ID', 'The new assignment id to change to.')
        .param(1, 'Submission ID', 'The id for the target submission.')
        .build();
}
