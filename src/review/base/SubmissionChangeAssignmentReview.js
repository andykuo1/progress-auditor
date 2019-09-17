import * as SubmissionDatabase from '../../database/SubmissionDatabase.js';

import * as Errors from '../helper/Errors.js';
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
                    Errors.throwInvalidReviewParamSubmissionIDError(db, value, params[1]);
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
    // HACK: To allow to use prev value in next review...
    // This should be handled directly by the Builder instead.
    let prevAssignmentID = '';
    const result = [];
    for(const error of errors)
    {
        const review = await buildStep(error, prevAssignmentID);
        prevAssignmentID = review.params[0];
        result.push(review);
    }
    return result;
}

async function buildStep(error, prevAssignmentID = '')
{
    return await createBuilder()
        .type(TYPE)
        .param(0, 'Assignment ID', 'The new assignment id to change to.', prevAssignmentID || '')
        .param(1, 'Submission ID', 'The id for the target submission.', error.context.submissionID || '')
        .build();
}
