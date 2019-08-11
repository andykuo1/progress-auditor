const { UserDatabase, ScheduleDatabase, SubmissionDatabase, AssignmentDatabase, DateUtil } = Library;

const SUBMISSION_TYPE_UNKNOWN = 'unknown';
const SUBMISSION_TYPE_SOURCE = 'source';
const SUBMISSION_TYPE_MINOR_EDIT = 'minor';
const SUBMISSION_TYPE_MAJOR_EDIT = 'major';

function evaluatePostType(submission, baseSubmission)
{
    if (submission === baseSubmission) return SUBMISSION_TYPE_SOURCE;
    // There are posts that have the same content, but different times. They are treated as minor edits;
    if (submission.attributes.content.body == baseSubmission.attributes.content.body) return SUBMISSION_TYPE_MINOR_EDIT;
    if (submission.attributes.content.body != baseSubmission.attributes.content.body) return SUBMISSION_TYPE_MAJOR_EDIT;

    // TODO: This will never be reached, but once we have a tolerance function for the body content compare, it will.
    if (submission.attributes.content.head != baseSubmission.attributes.content.head) return SUBMISSION_TYPE_MINOR_EDIT;
    return SUBMISSION_TYPE_UNKNOWN;
}

function setGradedSubmissionForAssignment(db, userID, assignmentID, submission)
{
    const assignment = AssignmentDatabase.getAssignmentByID(db, userID, assignmentID);
    assignment.attributes.submission = submission;
}

function getNearestSubmission(submissions, targetDate)
{
    let minSubmission = null;
    let minDateOffset = Infinity;
    for(const submission of submissions)
    {
        const dateOffset = DateUtil.compareDates(submission.date, targetDate);

        // If there exists a submission BEFORE the due date, return that one.
        if (minSubmission && dateOffset > 0)
        {
            return minSubmission;
        }

        // Otherwise...
        if (Math.abs(dateOffset) < minDateOffset)
        {
            minSubmission = submission;
            minDateOffset = Math.abs(dateOffset);
        }
    }
    return minSubmission;
}

/**
 * Searches through all submissions and assigns them to the appropriate assignment.
 * @param {Database} db The database to resolve for.
 */
async function resolve(db)
{
    for(const ownerKey of SubmissionDatabase.getOwners(db))
    {
        const userID = UserDatabase.getUserByOwnerKey(db, ownerKey);
        if (userID)
        {
            // Found owner -> user match! Now resolve post type...
            const submittedAssignments = SubmissionDatabase.getAssignedSubmissionsByOwnerKey(db, ownerKey);
            for(const assignmentID of Object.keys(submittedAssignments))
            {
                // Submissions are guaranteed to be in-order by time. The most recent entry being the last.
                const submissions = submittedAssignments[assignmentID];
                
                const ownedAssignment = AssignmentDatabase.getAssignmentByID(db, userID, assignmentID);
                if (ownedAssignment)
                {
                    const dueDate = ownedAssignment.dueDate;
                    // TODO: baseSubmission will change if there are reviews. That would mean the new reviewed will be the base.
                    const baseSubmission = getNearestSubmission(submissions, dueDate);
                    const nextSubmission = submissions[submissions.length - 1];
                    const postType = evaluatePostType(nextSubmission, baseSubmission);
    
                    // TODO: Always review major post edits. There is a post edit only if PAST the due date. Otherwise, it would be the new source.
                    // TODO: Should NOT ALWAYS pick the earliest one.
                    setGradedSubmissionForAssignment(db, userID, assignmentID, baseSubmission);
                    /*
                    if (postType === 'major')
                    {
                        setGradedSubmissionForAssignment(db, userID, assignmentID, nextSubmission);
                    }
                    else if (postType === 'source' || postType === 'minor')
                    {
                        setGradedSubmissionForAssignment(db, userID, assignmentID, baseSubmission);
                    }
                    else
                    {
                        db.throwError('[UNKNOWN_SUBMISSION_TYPE]\t', 'Unknown submission type - cannot evaluate edited post -', postType, '- DUE:', dueDate);
                        db.throwError('\t\t\t\t\t\t\t\tSubmission:', baseSubmission, '\n=-=-=-=-=-=>\n', nextSubmission);
                    }
                    */
    
                    // Submission is processed... delete content and mark as resolved.
                    for(const submission of submissions)
                    {
                        delete submission.attributes.content;
                    }
                }
                else
                {
                    db.throwError('[UNASSIGNED_SUBMISSION]\t\t', 'Found submission for unassigned assignment - cannot evaluate submission.',
                        '\nUser:', userID, UserDatabase.getUserByID(db, userID),
                        '\nSchedule:', ScheduleDatabase.getScheduleByUserID(db, userID),
                        '\nAssignment:', assignmentID, 'for', userID, '=>\n', submissions,
                        '\nSubmitted Assignments:', Object.keys(submittedAssignments));
                }
            }
        }
        else
        {
            const submissions = SubmissionDatabase.getAssignedSubmissionsByOwnerKey(db, ownerKey);
            db.throwError('[MISSING_USER]\t\t\t\t', "Cannot find user with owner key '" + ownerKey + "'.",
                "\nSubmissions by mismatched owner key:", submissions);
        }
    }
}

module.exports = {
    resolve
};
