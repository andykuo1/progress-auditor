import * as UserDatabase from '../../../database/UserDatabase.js';
import * as AssignmentDatabase from '../../../database/AssignmentDatabase.js';

const ERROR_TAG = 'REVIEW';

export const REVIEW_TYPE = 'change_assignment_status';
export const REVIEW_DESC = 'Changes the assignment status and slips for an owner.';
export const REVIEW_PARAM_TYPES = [
    'Owner Key',
    'Assignment ID',
    'Status (Y/N/_)',
    'Slip days (Optional)',
];

export async function review(db, config, reviewID, reviewType, reviewParams)
{
    if (reviewType !== REVIEW_TYPE) db.throwError(ERROR_TAG, `Mismatched review type - '${REVIEW_TYPE}' reviewer cannot process review type '${reviewType}'.`);
    if (reviewParams.length < 3) db.throwError(ERROR_TAG, `Missing review params - expected 3 parameters.`, { id: [reviewID, reviewType], options: [`Add more parameters to the review.`] });

    const ownerKey = reviewParams[0];
    const userID = UserDatabase.getUserByOwnerKey(db, ownerKey);
    if (!userID) db.throwError(ERROR_TAG, `Cannot find user for owner key ${ownerKey}`, { id: [reviewID, reviewType], options: [`Add missing owner key '${ownerKey}' to a user.`] })

    const assignmentID = reviewParams[1];
    const status = reviewParams[2];

    const slipDays = reviewParams.length > 3 ? Number(reviewParams[3]) : 0;
    const assignment = AssignmentDatabase.getAssignmentByID(db, userID, assignmentID);
    if (!assignment) db.throwError(ERROR_TAG, `Cannot find assignment for id ${assignmentID}`, { id: [reviewID, reviewType], options: [`User may not be assigned this assignment.`, `Assignment id may not exist.`] })

    assignment.attributes.status = status;
    assignment.attributes.slipDays = slipDays;
}
