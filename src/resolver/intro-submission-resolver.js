const SubmissionDatabase = require('../database/SubmissionDatabase.js');
const UserDatabase = require('../database/UserDatabase.js');

/**
 * Searches all unassigned submissions to check if they could also be 'intro' assignments.
 * @param {Database} db The database to resolve for.
 */
async function resolve(db)
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

module.exports = {
    resolve
};