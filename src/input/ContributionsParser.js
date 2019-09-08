import * as SubmissionDatabase from '../database/SubmissionDatabase.js';
import * as FileUtil from '../util/FileUtil.js';
import * as MathHelper from '../util/MathHelper.js';
import * as ParseUtil from '../util/ParseUtil.js';
import * as FieldParser from '../util/FieldParser.js';

function evaluatePostAssignment(headerContent, bodyContent)
{
    // Intro Assignment
    {
        if (/intro/i.test(headerContent))
        {
            return 'intro';
        }
    }
    // Weekly Assignment
    {
        const pattern = /week ?([0-9]+)/i;
        const result = pattern.exec(headerContent);
        if (result && result.length > 0)
        {
            if (result[1] == '0')
            {
                return 'intro';
            }
            else
            {
                return 'week[' + Number.parseInt(result[1]) + ']';
            }
        }
    }
    // Last Assignment
    {
        if (/last/i.test(headerContent))
        {
            return 'last';
        }
    }
    
    return 'null';
}

/*
How to resolve reports?

If the formula succeeds for the user, then generate a report for the user.
*/

/*
How to resolve vacations?

Result:
- Any submission already reviewed to be ON-HOLD due to vacation should be SHOWN each run.
- All later due dates should shift (if able) by the vacation length.
- Vacations can be indefinite.
- There can be multiple vacations.

Solution:
That means that vacations must be taken into account when generating due dates for an assignment.
And since assignments could always be due on a Sunday, per month basis, or any other restriction, it
would be best to allow assignments to handle vacations when generating the shifted due dates, instead
of altering post generation.
This also means that if a due date is shifted due to vacations, it should be marked as such.

Vacations should therefore ALWAYS have a start date and an end date (tentative). Even if indefinite, just put some large value.
Assignments, when generating schedules, should know about user vacations.
*/

/*
How to resolve assignments?

We must know:
- User vacations
- Assignment deadlines
- Assignment resolvers
- Submission date
- Submission content
- Current time

Result:
- We must be able to find the user's most recent submission for this assignment.
    - If the user does not have a submission for the assignment, then it should be in-complete.
    - Otherwise, it should be as expected.
- We must be able to check if the user's submission for the assignment is overdue.
    - We must therefore know the assignment due date for the user.
        - Due to vacations, this can factor into the user's deadline schedule.
- We must be able to assign submissions to the assignment for each user.
    - Since submission are just data, assignments must be able to determine itself by submission title and content.

Solution:
Assignment must have a schedule generator (that knows about vacations).

Should the assignment be responsible for resolving submission assignment?
- If assignments resolve it, submissions must save content for the assignment resolver.
- If parsers resolve it, submissions can be dependent on things other than content.
*/

/*
How to resolve submissions? Late and early submissions?

What do we want:
- The most recent submission. If the most recent is under review, we must save the base submission.

CAUTION:
- We do NOT process only the two most recent submissions because this can be a way to cheat the system.
By making MANY, but SMALL changes to the post, the program would never recognize the eventual divergence
from the base submission. It would think all the changes are too small to be relevant, but over many posts
these changes can add up. Therefore, the solution is to ONLY compare the most recent VALID solution and
the most recent solution. This also means that edited submissions that have gained slip days can only be
reviewed to remove ALL slip days, and therefore becomes valid, but not decrease the number of slip days.

What we must know:
- Submission date
- Submission content.
- The submission assignment.
- All submissions for the assignment.
- The assignment deadline.

Result:
- We must find the closest submission to the deadline, with priority to earlier submissions.
    - If no submissions exist, leave it blank.
    - If only late submissions exist, use the earliest one as the base.
    - If only early submissions exist, use the latest as the base.
    - If there are some of both, use the closest submission before the deadline as the base.
- Then use the most recent submission after as the target.
- Then, if the target and base are not the same, calculate the difference error from the base submission.
    - If the error is greater than a THRESHOLD, then flag for review.
    - Otherwise, use base as the MOST_RECENT_SUBMISSION.
*/

/**
 * Create SubmissionDatabase based on input file.
 * @param {Database} db The database to write to.
 * @param {Config} config The program config.
 * @param {String} filepath The path to the file to parse.
 * @param {Object} opts Any additional options.
 */
export async function parse(db, config, filepath, opts={})
{
    SubmissionDatabase.setupDatabase(db);

    let first = true;
    await FileUtil.readCSVFileByRow(filepath, (row) => {
        // Skip header...
        if (first) { first = false; return; }

        // 0. Anonymous
        // 1. Post Number
        // 2. Folders
        // 3. Created At
        // 4. Submission
        // 5. Submission HTML Removed
        // 6. Subject
        // 7. Part of Post
        // 8. Name
        // 9. Email
        // 10. Endorsed by Instructor
        // ... CUSTOM DATA BELOW ...
        // 11. UCSD Email
        // 12. Start date
        // 13. Week
        // 14. Base Sunday
        // 15. Deadline
        // 16. Slip days used
        try
        {
            // Ignore follow-ups...
            const postPart = row[7];
            if (postPart === 'followup'
                || postPart === 'reply_to_followup'
                || postPart === 'started_off_i_answer'
                || postPart === 'updated_i_answer'
                || postPart === 'started_off_s_answer'
                || postPart === 'updated_s_answer') return;

            // NOTE: To use, requires ownerKey -> userID Mapping
            const ownerKey = FieldParser.parseEmail(row[9]);
            const submitDate = ParseUtil.parseDate(row[3]);
            const postID = row[1];
            // NOTE: This has to be unique AND deterministic. In other words,
            // it must uniquely identify this submission given the same input.
            const submissionID = (Array.isArray(ownerKey) ? ownerKey[0] : ownerKey) + "#" + postID + "_" + MathHelper.stringHash(row[3]);

            const assignmentID = evaluatePostAssignment(row[6], row[5]);
            const attributes = {
                content: {
                    // Used to diff the content to determine if it should be
                    // considered a late submission or a minor edit.
                    head: row[6],
                    body: row[5],
                    // Used to auto-resolve unassigned assignments.
                    id: postID,
                }
            };

            const submission = SubmissionDatabase.addSubmission(db, submissionID, ownerKey, assignmentID, submitDate, attributes);
        }
        catch(e)
        {
            db.throwError('PARSE', 'Unable to parse submissions - ' + e);
        }
    });

    return db;
}
