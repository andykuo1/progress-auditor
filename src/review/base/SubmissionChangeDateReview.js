import * as SubmissionDatabase from '../../database/SubmissionDatabase.js';
import * as ParseUtil from '../../util/ParseUtil.js';

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
                    db.throwError(ERROR_TAG, `Invalid review param - unable to find submission for id '${params[0]}'.`, {
                        id: [id, type],
                        options: [
                            'The submission for that id is missing from the database.',
                            'Or it\'s the wrong id.'
                        ]
                    });
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

export async function build()
{
    return await createBuilder()
        .type(TYPE)
        .param(0, 'Submission ID', 'The target submission to change.')
        .param(1, 'Submission Date', 'The target date to change to.')
        .build();
}
