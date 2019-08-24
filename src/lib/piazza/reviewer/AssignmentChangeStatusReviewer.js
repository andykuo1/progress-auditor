import * as UserDatabase from '../../../database/UserDatabase.js';
import * as AssignmentDatabase from '../../../database/AssignmentDatabase.js';

export const REVIEW_ID = 'change_assignment_status';

export async function review(db, reviewID, reviewType, reviewParams)
{
    const ownerKey = reviewParams[0];
    const userID = UserDatabase.getUserByOwnerKey(db, ownerKey);
    const assignmentID = reviewParams[1];
    const status = reviewParams[2];
    const slipDays = reviewParams.length > 3 ? Number(reviewParams[3]) : 0;
    const assignment = AssignmentDatabase.getAssignmentByID(db, userID, assignmentID);
    assignment.attributes.status = status;
    assignment.attributes.slipDays = slipDays;
}
