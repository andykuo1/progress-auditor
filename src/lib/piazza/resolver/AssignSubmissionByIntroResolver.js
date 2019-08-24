import * as UserDatabase from '../../../database/UserDatabase.js';
import * as SubmissionDatabase from '../../../database/SubmissionDatabase.js';

/**
 * Searches all unassigned submissions to check if they could also be 'intro' assignments.
 * @param {Database} db The database to resolve for.
 */
export async function resolve(db)
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
