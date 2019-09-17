import * as SubmissionDatabase from '../../database/SubmissionDatabase.js';
import * as ParseUtil from '../../util/ParseUtil.js';

import * as Errors from '../helper/Errors.js';
import { createReviewer } from '../helper/Reviewer.js';
import { createBuilder } from '../helper/ReviewBuilder.js';

const ERROR_TAG = 'REVIEW';

export const TYPE = 'change_submission_date';
export const DESCRIPTION = 'Change date for submission.';

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
                const submission = SubmissionDatabase.getSubmissionByID(db, params[0]);
                if (!submission)
                {
                    Errors.throwInvalidReviewParamSubmissionIDError(db, value, params[0]);
                    return;
                }
            
                submission.date = ParseUtil.parseDate(params[1]);
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
        .param(0, 'Submission ID', 'The target submission to change.')
        .param(1, 'Submission Date', 'The target date to change to.')
        .build();
}
