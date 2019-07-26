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
const autoSubmissionResolver = require('./resolver/auto-submission-resolver.js');
const introSubmissionResolver = require('./resolver/intro-submission-resolver.js');

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
    let output;
    if (ERRORS.length <= 0)
    {
        output = "HOORAY! No errors!";
    }
    else
    {
        output = "It's okay. We'll get through this.\n\n" + ERRORS.join('\n');
    }
    writeToFile(path.resolve(outputDir, 'errors.txt'), output);
    ERRORS.length = 0;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

async function main()
{
    const db = Database.createDatabase();
    UserDatabase.setupDatabase(db);
    ScheduleDatabase.setupDatabase(db);
    SubmissionDatabase.setupDatabase(db);
    AssignmentDatabase.setupDatabase(db);

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

    // Process reviews...
    // NOTE: Review types should only exist if it CANNOT be fixed in input data.
    // (Except student response data as that should be immutable).
    const reviews = [];
    reviews.push(['submission', 'ignore_owner', 'minnes@eng.ucsd.edu']);
    reviews.push(['submission', 'ignore_owner', 'isk007@ucsd.edu']);
    reviews.push(['submission', 'ignore_owner', 'ziw123@ucsd.edu']);
    reviews.push(['submission', 'ignore_owner', 'Not currently enrolled']);
    reviews.push(['submission', 'ignore_owner', 'qis025@ucsd.edu']);
    reviews.push(['submission', 'ignore_owner', 'youladda@ucsd.edu']);
    reviews.push(['submission', 'ignore_owner', 'gkarma@ucsd.edu']);
    reviews.push(['submission', 'ignore_submission', 'm2gamez@ucsd.edu#115_-1911500402']);
    reviews.push(['submission', 'ignore_submission', 'e4yuan@ucsd.edu#215_-1461330551']);
    reviews.push(['submission', 'ignore_submission', 'narasimhan.prithvi@gmail.com#286_756523392']);
    reviews.push(['submission', 'ignore_submission', 'tyc020@ucsd.edu#182_-422442142']);
    reviews.push(['submission', 'ignore_submission', 'c5gong@ucsd.edu#107_1847803749']);
    reviews.push(['user', 'add_owner_key', 'anencion@ucsd.edu', 'alberto.nencioni97@gmail.com']);
    reviews.push(['user', 'add_owner_key', 'p1narasi@ucsd.edu', 'narasimhan.prithvi@gmail.com']);
    reviews.push(['user', 'add_owner_key', 'msheng@ucsd.edu', 'mshen010@ucr.edu']);
    reviews.push(['submission', 'change_assignment', 'intro', 'rcajigal@ucsd.edu#23_786805681']);
    reviews.push(['submission', 'change_assignment', 'intro', 'mkc012@ucsd.edu#35_1587235547']);
    reviews.push(['submission', 'change_assignment', 'intro', 'nalrashe@ucsd.edu#38_-705949288']);
    reviews.push(['submission', 'change_assignment', 'intro', 'jiw360@ucsd.edu#42_-1628797953']);
    reviews.push(['submission', 'change_assignment', 'intro', 'j1hsieh@ucsd.edu#44_-183030877']);
    reviews.push(['submission', 'change_assignment', 'intro', 'spasumar@ucsd.edu#46_-1155280126']);
    reviews.push(['submission', 'change_assignment', 'intro', 'tkmak@ucsd.edu#47_-292553923']);
    reviews.push(['submission', 'change_assignment', 'intro', 'zjjohnso@ucsd.edu#49_-338066807']);
    reviews.push(['submission', 'change_assignment', 'week[1]', 'cprashan@ucsd.edu#173_-1997604468']);
    reviews.push(['submission', 'change_assignment', 'week[4]', 'yic264@ucsd.edu#304_-1488048069']);

    for(const review of reviews)
    {
        const [targetDatabase, reviewType, ...reviewParams] = review;
        switch(reviewType)
        {
            case 'ignore_owner':
                if (targetDatabase === 'submission')
                {
                    SubmissionDatabase.clearSubmissionsByOwner(db, reviewParams[0]);
                    continue;
                }
                break;
            case 'ignore_submission':
                if (targetDatabase === 'submission')
                {
                    const targetSubmission = SubmissionDatabase.getSubmissionByID(db, reviewParams[0]);
                    if (!targetSubmission)
                    {
                        error('[INVALID_REVIEW_PARAM] Submission for id is already removed.');
                        continue;
                    }

                    const deleteSubmisssionIDs = [];
                    for(const submissionID of SubmissionDatabase.getSubmissions(db))
                    {
                        const submission = SubmissionDatabase.getSubmissionByID(db, submissionID);
                        if (submission.owner == targetSubmission.owner
                            && submission.attributes.content.id == targetSubmission.attributes.content.id)
                        {
                            deleteSubmisssionIDs.push(submissionID);
                        }
                    }

                    for(const submissionID of deleteSubmisssionIDs)
                    {
                        SubmissionDatabase.removeSubmissionByID(db, submissionID);
                    }
                    continue;
                }
            case 'change_assignment':
                if (targetDatabase === 'submission')
                {
                    const submission = SubmissionDatabase.getSubmissionByID(db, reviewParams[1]);
                    if (!submission)
                    {
                        error('[INVALID_REVIEW_PARAM]', 'Unable to find submission for id.');
                        continue;
                    }
                    SubmissionDatabase.changeSubmissionAssignment(db, submission, reviewParams[0]);
                    continue;
                }
                break;
            case 'add_owner_key':
                if (targetDatabase === 'user')
                {
                    const user = UserDatabase.getUserByID(db, reviewParams[0]);
                    if (!user)
                    {
                        error('[INVALID_REVIEW_PARAM]', 'Unable to find user for id.');
                        continue;
                    }
                    if (Array.isArray(user.ownerKey))
                    {
                        user.ownerKey.push(reviewParams[1]);
                        continue;
                    }
                    else
                    {
                        user.ownerKey = [user.ownerKey, reviewParams[1]];
                        continue;
                    }
                }
                break;
            default:
                error('[UNKNOWN_REVIEW]', 'Unknown review type', reviewType);
        }
        error('[REVIEW_DATABASE_MISMATCH]', 'Target database mismatch for review type:', targetDatabase, '->', reviewType);
    }

    // Try to auto-resolve unassigned assignments by post id.
    await introSubmissionResolver.resolve(db);
    await autoSubmissionResolver.resolve(db);

    // 2nd pass - Evaluate post type
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
                    error('\t\t\t\t\t\t\t\tUser:', userID, UserDatabase.getUserByID(db, userID));
                    error('\t\t\t\t\t\t\t\tSchedule:', ScheduleDatabase.getScheduleByUserID(db, userID));
                    error('\t\t\t\t\t\t\t\tAssignment:', assignmentID, 'for', userID, '=>\n', submissions);
                    error('\t\t\t\t\t\t\t\tSubmitted Assignments:', Object.keys(submittedAssignments));
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
