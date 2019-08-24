import * as UserDatabase from '../../../database/UserDatabase.js';
import * as AssignmentDatabase from '../../../database/AssignmentDatabase.js';
import * as SubmissionDatabase from '../../../database/SubmissionDatabase.js';
import * as ParseUtil from '../../../util/ParseUtil.js';
import { stringHash } from '../../../util/MathHelper.js';

export const REVIEW_ID = 'add_submission';

export async function review(db, reviewID, reviewType, reviewParams)
{
    const ownerKey = reviewParams[0];
    const userID = UserDatabase.getUserByOwnerKey(db, ownerKey);
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
