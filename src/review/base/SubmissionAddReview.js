import * as UserDatabase from '../../database/UserDatabase.js';
import * as AssignmentDatabase from '../../database/AssignmentDatabase.js';
import * as SubmissionDatabase from '../../database/SubmissionDatabase.js';
import * as DateUtil from '../../util/DateUtil.js';
import { stringHash } from '../../util/MathHelper.js';

import { createReviewer } from '../helper/Reviewer.js';
import { createBuilder } from '../helper/ReviewBuilder.js';

const ERROR_TAG = 'REVIEW';

export const TYPE = 'add_submission';
export const DESCRIPTION = 'Add submission (with assignment) for owner.';

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
                const ownerKey = params[0];
                const userID = UserDatabase.getUserByOwnerKey(db, ownerKey);
                if (!userID)
                {
                    return;
                    db.throwError(ERROR_TAG, `Cannot find user for owner key ${ownerKey}`, {
                        id: [id, type],
                        options: [`Add missing owner key '${ownerKey}' to a user.`]
                    });
                }
                
                const assignmentID = params[1];
                const submissionID = ownerKey + '#proxy_' + stringHash(`${id}:${ownerKey}.${assignmentID}`);
                const submissionDate = params.length >= 2
                    ? DateUtil.parse(params[2])
                    : new Date(AssignmentDatabase.getAssignmentByID(db, userID, assignmentID).dueDate.getTime() - 1);
                const submissionAttributes = params.length >= 3
                    ? JSON.parse(params[3])
                    : {};
                
                if (SubmissionDatabase.getSubmissionByID(db, submissionID))
                {
                    console.log("...Ignoring dupliate reviewed submission...");
                    return;
                }

                SubmissionDatabase.addSubmission(db, submissionID, ownerKey, assignmentID, submissionDate, submissionAttributes);
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
        .param(0, 'Owner Key', 'The target owner to add the submission for.')
        .param(1, 'Assignment ID', 'The submission\'s assignment ID.')
        .param(2, '[Submission Date]', 'An optional parameter for the date of the new submission.')
        .param(3, '[Submission Attributes]', 'An optional parameter object for additional attributes.')
        .build();
}
