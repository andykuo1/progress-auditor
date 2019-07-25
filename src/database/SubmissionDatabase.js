const Submission = require('./Submission.js');
const { compareDates } = require('../util/DateUtil.js');

const SUBMISSION_KEY = 'submission';
const OUTPUT_LOG = 'db.submission.log';

function setupDatabase(db)
{
    if (!(SUBMISSION_KEY in db))
    {
        db[SUBMISSION_KEY] = new Map();
    }
    return db;
}

function addSubmission(db, ownerKey, assignmentID, submissionDate, attributes={})
{
    const submissionMapping = db[SUBMISSION_KEY];

    // Make sure that owner key is NOT an array... otherwise pick an arbitrary one.
    if (Array.isArray(ownerKey)) ownerKey = ownerKey[0];

    // Create submission...
    const submission = Submission.createSubmission(ownerKey, assignmentID, submissionDate, attributes);

    // Get submission list by owner...
    let ownedSubmissions = submissionMapping.get(ownerKey);
    if (!ownedSubmissions) submissionMapping.set(ownerKey, ownedSubmissions = {});

    // If there exists submissions by the owner for this assignment already...
    if (assignmentID in ownedSubmissions)
    {
        // Get the other submissions already processed for the same assignment...
        const assignedSubmissions = ownedSubmissions[assignmentID];

        // Insert into appropriate order...
        let i = 0;
        for(; i < assignedSubmissions.length; ++i)
        {
            if (compareDates(submissionDate, assignedSubmissions[i].date) < 0)
            {
                break;
            }
        }

        // Insert submission for assignment...
        assignedSubmissions.splice(i, 0, submission);
    }
    else
    {
        // Add new submission for assignment...
        ownedSubmissions[assignmentID] = [submission];
    }

    return submission;
}

/**
 * Gets an array of submission belonging to the owner.
 * @param {Database} db The database to search through.
 * @param {*} ownerKey The owner key to search by (is not the same as user id).
 * @returns {Array<Submission>} An array of the owner's submissions, null if owner not found.
 */
function getSubmissionsByOwnerKey(db, ownerKey)
{
    return db[SUBMISSION_KEY].get(ownerKey);
}

/**
 * Gets an iterable of all registered owners with submissions.
 * @param {Database} db The database to search through.
 * @returns {Iterable<*>} An iterable of owner ids.
 */
function getOwners(db)
{
    return db[SUBMISSION_KEY].keys();
}

function outputLog(db, outputDir = '.')
{
    const submissionMapping = db[SUBMISSION_KEY];
    const result = {};
    for(const [key, value] of submissionMapping.entries())
    {
        result[key] = value;
    }
    
    const header = `${'# '.repeat(20)}\n# Submissions\n# Size: ${submissionMapping.size}\n${'# '.repeat(20)}`;
    const log = `${header}\n${JSON.stringify(result, null, 4)}`;
    require('fs').writeFileSync(require('path').resolve(outputDir, OUTPUT_LOG), log);
}

module.exports = {
    SUBMISSION_KEY,
    setupDatabase,
    addSubmission,
    getSubmissionsByOwnerKey,
    getOwners,
    outputLog,
};