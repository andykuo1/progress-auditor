import * as UserDatabase from '../../database/UserDatabase.js';
import * as SubmissionDatabase from '../../database/SubmissionDatabase.js';
import * as AssignmentDatabase from '../../database/AssignmentDatabase.js';

const ERROR_TAG = 'REVIEW';

export const TYPE = 'assignment_by_intro';
export const DESCRIPTION = 'Assigns submission by matching intro headers.';

const WEEK_PATTERN = /week ?([0-9]+)/i;

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

                // Find the last week's assignment number...
                const assignments = AssignmentDatabase.getAssignmentsByUser(db, userID);
                let maxAssignmentNumber = 0;
                for(const assignmentID of assignments)
                {
                    const result = WEEK_PATTERN.exec(assignmentID);
                    if (result && result.length >= 2)
                    {
                        try
                        {
                            const assignmentNumber = Number.parseInt(result[1]);
                            if (assignmentNumber > maxAssignmentNumber)
                            {
                                maxAssignmentNumber = assignmentNumber;
                            }
                        }
                        catch(e)
                        {
                            // Ignore it.
                        }
                    }
                }
                const lastWeekNumber = maxAssignmentNumber + 1;
        
                const assignedSubmissions = SubmissionDatabase.getAssignedSubmissionsByOwnerKey(db, ownerKey);
                if ('null' in assignedSubmissions)
                {
                    const unassignedSubmissions = assignedSubmissions['null'].slice();
                    for(const unassignedSubmission of unassignedSubmissions)
                    {
                        const headerContent = unassignedSubmission.attributes.content.head;
                        const result = WEEK_PATTERN.exec(headerContent);
                        if (result && result.length >= 2)
                        {
                            if (result[1] == lastWeekNumber)
                            {
                                SubmissionDatabase.changeSubmissionAssignment(db, unassignedSubmission, 'last');
                            }
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
