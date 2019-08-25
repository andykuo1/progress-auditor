import * as UserDatabase from '../../../database/UserDatabase.js';
import * as AssignmentDatabase from '../../../database/AssignmentDatabase.js';
import * as SubmissionDatabase from '../../../database/SubmissionDatabase.js';
import * as ParseUtil from '../../../util/ParseUtil.js';
import { stringHash } from '../../../util/MathHelper.js';

export const REVIEW_TYPE = 'add_submission';
export const REVIEW_DESC = 'Add submission (with assignment) for owner.';
export const REVIEW_PARAM_TYPES = [
    'Owner Key',
    'Assignment ID',
    'Submission Date (Optional)',
    'Submission Attributes (Optional)',
];

export async function review(db, reviewID, reviewType, reviewParams)
{
    if (reviewType !== REVIEW_TYPE) db.throwError(`Mismatched review type - '${REVIEW_TYPE}' reviewer cannot process review type '${reviewType}'.`);
    if (reviewParams.length < 2) db.throwError(`Missing review params - expected 2 parameters.`, { id: [reviewID, reviewType], options: [`Add more parameters to the review.`] });

    const ownerKey = reviewParams[0];
    const userID = UserDatabase.getUserByOwnerKey(db, ownerKey);
    if (!userID) db.throwError(`Cannot find user for owner key ${ownerKey}`, { id: [reviewID, reviewType], options: [`Add missing owner key '${ownerKey}' to a user.`] })
    
    const assignmentID = reviewParams[1];
    const submissionID = ownerKey + '#proxy_' + stringHash(`${reviewID}:${ownerKey}.${assignmentID}`);
    const submissionDate = reviewParams.length >= 2
        ? ParseUtil.parseAmericanDate(reviewParams[2])
        : new Date(AssignmentDatabase.getAssignmentByID(db, userID, assignmentID).dueDate.getTime() - 1);
    const submissionAttributes = reviewParams.length >= 3
        ? JSON.parse(reviewParams[3])
        : {};
    SubmissionDatabase.addSubmission(db, submissionID, ownerKey, assignmentID, submissionDate, submissionAttributes);
}
