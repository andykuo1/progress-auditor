const path = require('path');

const Database = require('./database/Database.js');
const UserDatabase = require('./database/UserDatabase.js');
const ScheduleDatabase = require('./database/ScheduleDatabase.js');
const SubmissionDatabase = require('./database/SubmissionDatabase.js');
const AssignmentDatabase = require('./database/AssignmentDatabase.js');
const AssignmentGenerator = require('./database/AssignmentGenerator.js');
const { offsetDate, compareDates } = require('./util/DateUtil.js');
const { writeToFile } = require('./util/FileUtil.js');
const cohortParser = require('./parser/cohort-parser.js');
const contributionsParser = require('./parser/contributions-parser.js');

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const INPUT_DIR = path.resolve(__dirname, '__TEST__/in/');
const OUTPUT_DIR = path.resolve(__dirname, '__TEST__/out/');

const ERRORS = [];
function error(...messages)
{
    ERRORS.push(messages.map(e => {
        switch(typeof e)
        {
            case 'string':
                return e;
            case 'object':
                return JSON.stringify(e, null, 4);
            default:
                return String(e);
        }
    }).join(' '));
}
function outputError(outputDir)
{
    writeToFile(path.resolve(outputDir, 'errors.txt'), ERRORS.join('\n'));
    ERRORS.length = 0;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

async function main()
{
    const db = Database.createDatabase();

    // Create users and schedules...
    await cohortParser.parse(path.resolve(INPUT_DIR, 'cohort.csv'), db);

    // Create submissions...
    await contributionsParser.parse(path.resolve(INPUT_DIR, 'contributions.csv'), db);

    // Create assignments...
    AssignmentDatabase.setupDatabase(db);
    for(const userID of UserDatabase.getUsers(db))
    {
        const schedule = ScheduleDatabase.getScheduleByUserID(db, userID);

        AssignmentGenerator.assign(db, userID, 'intro', offsetDate(schedule.startDate, 7));
        AssignmentGenerator.assignWeekly(db, userID, 'week', schedule.firstSunday, schedule.lastSunday);
        AssignmentGenerator.assign(db, userID, 'last', new Date(schedule.lastSunday));
    }

    // 2nd pass - Evaluate post type
    for(const ownerKey of SubmissionDatabase.getOwners(db))
    {
        // TODO: There should be some way to get this information elsewhere...
        const ignoredOwners = [
            'minnes@eng.ucsd.edu',
            'isk007@ucsd.edu',
            'ziw123@ucsd.edu',
            'Not currently enrolled',
            'qis025@ucsd.edu',
        ];
        if (ignoredOwners.includes(ownerKey)) continue

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
                        error('[UNKNOWN_SUBMISSION_TYPE]\t', 'Unknown submission type - cannot evaluate edited post -', postType, '- DUE:', dueDate);
                        error('\t\t\t\t\t\t\t\tSubmission:', baseSubmission, '\n=-=-=-=-=-=>\n', nextSubmission);
                    }
    
                    // Submission is processed... delete content and mark as resolved.
                    for(const submission of submissions)
                    {
                        delete submission.attributes.content;
                    }
                }
                else
                {
                    /*
                    Non-submissions
                        e4yuan@ucsd.edu
                        m2gamez@ucsd.edu
                        c5gong@ucsd.edu
                        tyc020@ucsd.edu
                    
                    Ill-formatted Subjects
                        cprashan@ucsd.edu
                        yic264@ucsd.edu
                        ... AND THEN EVERYBODY ELSE!
                    */
                    error('[UNASSIGNED_SUBMISSION]\t\t', 'Found submission for unassigned assignment - cannot evaluate submission.');
                    error('\t\t\t\t\t\t\t\tAssignment:', assignmentID, 'for', userID, '=>\n', submissions);
                }
            }
        }
        else
        {
            /*
            Non-users:
                minnes@eng.ucsd.edu
            Missing from Cohort / File:
                isk007@ucsd.edu
                ziw123@ucsd.edu
                Not currently enrolled
                qis025@ucsd.edu
            Missing owner key:
                mshen010@ucr.edu -> msheng@ucsd.edu
                narasimhan.prithvi@gmail.com -> p1narasi@ucsd.edu
            */
            const submissions = SubmissionDatabase.getAssignedSubmissionsByOwnerKey(db, ownerKey);
            error('[MISSING_USER]\t\t\t\t', "Cannot find user with owner key '" + ownerKey + "'.");
            error("\t\t\t\t\t\t\t\tSubmissions by mismatched owner key:", submissions);
        }
    }

    UserDatabase.outputLog(db, OUTPUT_DIR);
    ScheduleDatabase.outputLog(db, OUTPUT_DIR);
    SubmissionDatabase.outputLog(db, OUTPUT_DIR);
    AssignmentDatabase.outputLog(db, OUTPUT_DIR);

    outputError(OUTPUT_DIR);
}

main();

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

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
    const user = UserDatabase.getUserByID(db, userID);
    let activeSubmissions;
    if ('activeSubmissions' in user.attributes)
    {
        activeSubmissions = user.attributes.activeSubmissions;
    }
    else
    {
        activeSubmissions = user.attributes.activeSubmissions = {};
    }
    activeSubmissions[assignmentID] = submission;
}

function getNearestSubmission(submissions, targetDate)
{
    let minSubmission = null;
    let minDateOffset = Infinity;
    for(const submission of submissions)
    {
        const dateOffset = compareDates(submission.date, targetDate);

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
