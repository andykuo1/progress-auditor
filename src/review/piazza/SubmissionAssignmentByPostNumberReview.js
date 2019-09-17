import * as SubmissionDatabase from '../../database/SubmissionDatabase.js';
import * as UserDatabase from '../../database/UserDatabase.js';
import * as AssignmentDatabase from '../../database/AssignmentDatabase.js';
import * as Client from '../../client/Client.js';

const ERROR_TAG = 'REVIEW';

export const TYPE = 'assignment_by_post';
export const DESCRIPTION = 'Assigns submission by matching post id.';

/**
 * Searches through all submissions and tries to assign them by post id.
 * @param {Database} db The database.
 * @param {Config} config The config.
 */
export async function review(db, config)
{
    try
    {
        for(const submissionID of SubmissionDatabase.getSubmissions(db))
        {
            const submission = SubmissionDatabase.getSubmissionByID(db, submissionID);
            const userID = UserDatabase.getUserByOwnerKey(db, submission.owner);
            // Skip any unknown owner keys. It is not my job.
            if (!userID) continue;
            const validAssignments = AssignmentDatabase.getAssignmentsByUser(db, userID);

            // If this submission is not assigned correctly (not only unassigned)...
            if (!validAssignments.includes(submission.assignment))
            {
                const unassignedSubmission = submission;

                let resolved = false;
                const ownerKey = unassignedSubmission.owner;
                const assignedSubmissions = SubmissionDatabase.getAssignedSubmissionsByOwnerKey(db, ownerKey);
                for(const [assignmentID, submissions] of Object.entries(assignedSubmissions))
                {
                    // If it is a properly assigned assignment...
                    if (!validAssignments.includes(assignmentID)) continue;

                    for(const ownedSubmission of submissions)
                    {
                        // And it has the same post id as the unassigned one...
                        if (unassignedSubmission.attributes.content.id === ownedSubmission.attributes.content.id)
                        {
                            // It should be of the same assignment :D
                            SubmissionDatabase.changeSubmissionAssignment(db, unassignedSubmission, ownedSubmission.assignment);
                            resolved = true;
                        }

                        if (resolved) break;
                    }
                    if (resolved) break;
                }
            }
        }
    }
    catch(e)
    {
        Client.error(e);
        throw e;
    }
}

// No build mode for this review...
export const build = undefined;
