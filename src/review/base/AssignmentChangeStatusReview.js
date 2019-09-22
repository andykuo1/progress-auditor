import * as Errors from '../helper/Errors.js';
import { createReviewer } from '../helper/Reviewer.js';
import { createBuilder } from '../helper/ReviewBuilder.js';

export const TYPE = 'change_assignment_status';
export const DESCRIPTION = 'Changes the assignment status and slips for an owner.';

export async function review(db, config)
{
    try
    {
        await createReviewer()
            .type(TYPE)
            .paramLength(3)
            .forEach(value =>
            {
                const { id, type, params } = value;
                const ownerKey = params[0];
                const userID = UserDatabase.getUserByOwnerKey(db, ownerKey);
                if (!userID)
                {
                    Errors.throwInvalidReviewParamOwnerKeyError(db, value, ownerKey);
                    return;
                }
            
                const assignmentID = params[1];
                const status = params[2];
            
                const slipDays = params.length > 3 ? Number(params[3]) : 0;
                const assignment = AssignmentDatabase.getAssignmentByID(db, userID, assignmentID);
                if (!assignment) {
                    Errors.throwInvalidReviewParamAssignmentIDError(db, value, assignmentID);
                    return;
                }
            
                assignment.attributes.status = status;
                assignment.attributes.slipDays = slipDays;
            })
            .review(db, config);
    }
    catch(e)
    {
        Client.error(e);
        throw e;
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
        .param(0, 'Owner Key', 'The target owner with the target assignment')
        .param(1, 'Assignment ID', 'The target assignment ID')
        .param(2, 'Status', 'The new status for the assignment')
        .param(3, '[Slip Days]', 'An optional parameter for the number of new slips days.')
        .build();
}
