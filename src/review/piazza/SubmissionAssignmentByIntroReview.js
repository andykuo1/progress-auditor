import * as UserDatabase from '../../database/UserDatabase.js';
import * as SubmissionDatabase from '../../database/SubmissionDatabase.js';

const ERROR_TAG = 'REVIEW';

export const TYPE = 'assignment_by_intro';
export const DESCRIPTION = 'Assigns submission by matching intro headers.';

/**
 * Searches all unassigned submissions to check if they could also be 'intro' assignments.
 * @param {Database} db The database.
 * @param {Config} config The config.
 */
export async function review(db, config)
{
    try
    {
        for(const ownerKey of SubmissionDatabase.getOwners(db))
        {
            const userID = UserDatabase.getUserByOwnerKey(db, ownerKey);
            if (userID)
            {
                const userName = UserDatabase.getUserByID(db, userID).name;
        
                const assignedSubmissions = SubmissionDatabase.getAssignedSubmissionsByOwnerKey(db, ownerKey);
                if ('null' in assignedSubmissions)
                {
                    const unassignedSubmissions = assignedSubmissions['null'].slice();
                    for(const unassignedSubmission of unassignedSubmissions)
                    {
                        if (unassignedSubmission.attributes.content.head.trim() === userName)
                        {
                            SubmissionDatabase.changeSubmissionAssignment(db, unassignedSubmission, 'intro');
                        }
                    }
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
