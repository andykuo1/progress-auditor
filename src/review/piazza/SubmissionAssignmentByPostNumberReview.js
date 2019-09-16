import * as SubmissionDatabase from '../../database/SubmissionDatabase.js';

const ERROR_TAG = 'REVIEW';

export const TYPE = 'assignment_by_post';
export const DESCRIPTION = 'Assigns submission by matching post id.';

/**
 * Searches through all submissions and tries to assign them by post id.
 * @param {Database} db The database.
 * @param {Config} config The config.
 * @param {Database} reviewDatabase The review database.
 */
export async function review(db, config, reviewDatabase)
{
    try
    {
        for(const submissionID of SubmissionDatabase.getSubmissions(db))
        {
            const submission = SubmissionDatabase.getSubmissionByID(db, submissionID);
            if (submission.assignment === 'null')
            {
                const unassignedSubmission = submission;

                let resolved = false;
                const ownerKey = unassignedSubmission.owner;
                const assignedSubmissions = SubmissionDatabase.getAssignedSubmissionsByOwnerKey(db, ownerKey);
                for(const [assignmentID, submissions] of Object.entries(assignedSubmissions))
                {
                    // If it is a properly assigned assignment...
                    if (assignmentID === 'null') continue;

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
        db.throwError(ERROR_TAG, e);
    }
}

// No build mode for this review...
export const build = undefined;
