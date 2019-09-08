import * as Submission from './Submission.js';
import { compareDates } from '../util/DateUtil.js';

export const SUBMISSION_KEY = 'submission';
export const SUBMISSION_OWNER_KEY = 'owner';
export const SUBMISSION_LIST_KEY = 'list';
const OUTPUT_LOG = 'db.submission.log';

export function setupDatabase(db)
{
    if (!(SUBMISSION_KEY in db)) db[SUBMISSION_KEY] = {};
    
    const submissionMapping = db[SUBMISSION_KEY];
    if (!(SUBMISSION_OWNER_KEY in submissionMapping))
    {
        submissionMapping[SUBMISSION_OWNER_KEY] = new Map();
    }
    if (!(SUBMISSION_LIST_KEY in submissionMapping))
    {
        submissionMapping[SUBMISSION_LIST_KEY] = new Map();
    }

    return db;
}

export function clearDatabase(db)
{
    if (SUBMISSION_KEY in db)
    {
        db[SUBMISSION_KEY][SUBMISSION_OWNER_KEY].clear();
        db[SUBMISSION_KEY][SUBMISSION_LIST_KEY].clear();
    }
    return db;
}

export function addSubmission(db, submissionID, ownerKey, assignmentID, submissionDate, attributes={})
{
    const submissionMapping = db[SUBMISSION_KEY];
    const submissionOwnerMapping = submissionMapping[SUBMISSION_OWNER_KEY];
    const submissionListMapping = submissionMapping[SUBMISSION_LIST_KEY];

    if (!submissionListMapping.has(submissionID))
    {
        // Make sure that owner key is NOT an array... otherwise pick an arbitrary one.
        if (Array.isArray(ownerKey)) ownerKey = ownerKey[0];

        // Create submission...
        const submission = Submission.createSubmission(submissionID, ownerKey, assignmentID, submissionDate, attributes);

        // Get assigned submission list by owner...
        let assignedSubmissions = submissionOwnerMapping.get(ownerKey);
        if (!assignedSubmissions) submissionOwnerMapping.set(ownerKey, assignedSubmissions = {});

        // Add submission to the correct assignment submissions list AND in proper order...
        addSubmissionToAssignment(submission, assignmentID, assignedSubmissions);

        // Add submission to submissions list
        submissionListMapping.set(submissionID, submission);

        return submission;
    }
    else
    {
        db.throwError(SUBMISSION_KEY, `Found duplicate id for submission '${submissionID}'.`);
        return null;
    }
}

/**
 * Adds the submission to the appropriate assignment submissions list and insert in proper order.
 * @private
 * @param {Submission} submission The submission data object.
 * @param {String} assignmentID The assignment id to add the submission to. This should be the same as the assignment field in the submission object.
 * @param {Object} assignedSubmissions The assignment-submissions mapping to add to.
 * @returns {Submission} The submission added.
 */
export function addSubmissionToAssignment(submission, assignmentID, assignedSubmissions)
{
    // Makes sure the submission has the same assignment.
    submission.assignment = assignmentID;

    // If there exists submissions by the owner for this assignment already...
    if (assignmentID in assignedSubmissions)
    {
        // Get the other submissions already processed for the same assignment...
        const submissions = assignedSubmissions[assignmentID];

        // Insert into appropriate order...
        let i = 0;
        for(; i < submissions.length; ++i)
        {
            if (compareDates(submission.date, submissions[i].date) < 0)
            {
                break;
            }
        }

        // Insert submission for assignment...
        submissions.splice(i, 0, submission);
    }
    else
    {
        // Add new submission for assignment...
        assignedSubmissions[assignmentID] = [submission];
    }

    return submission;
}

/**
 * Assumes the submission has already been successfully inserted into the database.
 * @param {Database} db The database to change submission for.
 * @param {Submission} submission The submission data object to change assignment for.
 * @param {String} [newAssignmentID] The assignment to change the submission to. If not
 * specified, will not add the submission back into assignments.
 * @returns {Submission} The changed submission.
 */
export function changeSubmissionAssignment(db, submission, newAssignmentID=undefined)
{
    const submissionOwnerMapping = db[SUBMISSION_KEY][SUBMISSION_OWNER_KEY];
    const assignedSubmissions = submissionOwnerMapping.get(submission.owner);
    const submissions = assignedSubmissions[submission.assignment];
    const submissionIndex = submissions.indexOf(submission);
    if (submissionIndex >= 0)
    {
        submissions.splice(submissionIndex, 1);
        if (submissions.length <= 0)
        {
            delete assignedSubmissions[submission.assignment];
        }
    }
    else
    {
        throw new Error(`Cannot find submission for assignment ${submission.assignment}.`);
    }

    if (typeof newAssignmentID !== 'undefined')
    {
        addSubmissionToAssignment(submission, newAssignmentID, assignedSubmissions);
    }
    return submission;
}

/**
 * Gets an array of submission belonging to the owner.
 * @param {Database} db The database to search through.
 * @param {String} ownerKey The owner key to search by (is not the same as user id).
 * @returns {Array<Submission>} An array of the owner's submissions, null if owner not found.
 */
export function getAssignedSubmissionsByOwnerKey(db, ownerKey)
{
    return db[SUBMISSION_KEY][SUBMISSION_OWNER_KEY].get(ownerKey);
}

export function getSubmissionByID(db, submissionID)
{
    return db[SUBMISSION_KEY][SUBMISSION_LIST_KEY].get(submissionID);
}

/**
 * Gets an iterable of all registered owners with submissions.
 * @param {Database} db The database to search through.
 * @returns {Iterable<String>} An iterable of owner ids.
 */
export function getOwners(db)
{
    return db[SUBMISSION_KEY][SUBMISSION_OWNER_KEY].keys();
}

/**
 * Gets an iterable of all registered submissions.
 * @param {Database} db The database to search through.
 * @returns {Iterable<String>} An iterable of submission ids.
 */
export function getSubmissions(db)
{
    return db[SUBMISSION_KEY][SUBMISSION_LIST_KEY].keys();
}

export function clearSubmissionsByOwner(db, ownerKey)
{
    // Remove from list mapping...
    const submissionListMapping = db[SUBMISSION_KEY][SUBMISSION_LIST_KEY];
    const assignedSubmissions = getAssignedSubmissionsByOwnerKey(db, ownerKey);
    if (assignedSubmissions)
    {
        for(const submissions of Object.values(assignedSubmissions))
        {
            for(const submission of submissions)
            {
                submissionListMapping.delete(submission.id);
            }
        }
    }
    // Remove from owner mapping...
    const submissionOwnerMapping = db[SUBMISSION_KEY][SUBMISSION_OWNER_KEY];
    submissionOwnerMapping.delete(ownerKey);
}

export function removeSubmissionByID(db, submissionID)
{
    // Remove from list mapping...
    const submissionListMapping = db[SUBMISSION_KEY][SUBMISSION_LIST_KEY];
    const submission = submissionListMapping.get(submissionID);
    if (!submission)
    {
        throw new Error(`Cannot find submission for id ${submissionID}.`);
    }
    submissionListMapping.delete(submissionID);

    // Remove from owner mapping...
    // This acts like a remove when no new assignment id is specified.
    changeSubmissionAssignment(db, submission);
}

export function outputLog(db, outputDir = '.')
{
    const submissionOwnerMapping = db[SUBMISSION_KEY][SUBMISSION_OWNER_KEY];
    const submissionListMapping = db[SUBMISSION_KEY][SUBMISSION_LIST_KEY];
    const result = {
        owner: {},
        list: {},
    };
    for(const [key, value] of submissionOwnerMapping.entries())
    {
        result.owner[key] = value;
    }
    for(const [key, value] of submissionListMapping.entries())
    {
        result.list[key] = value;
    }
    
    const header = `${'# '.repeat(20)}\n# Submissions\n# Size: ${submissionListMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    require('fs').writeFileSync(require('path').resolve(outputDir, OUTPUT_LOG), log);
}
