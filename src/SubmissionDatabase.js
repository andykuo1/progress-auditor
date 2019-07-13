const Submission = require('./Submission.js');
const { compareDates } = require('./DateUtil.js');

const SUBMISSION_KEY = 'submission';

function setupDatabase(db)
{
    db[SUBMISSION_KEY] = new Map();
    return db;
}

function addSubmission(db, ownerID, assignmentID, submissionDate, submissionType=Submission.SUBMISSION_TYPE_UNKNOWN)
{
    const submissionMapping = db[SUBMISSION_KEY];

    // Create submission...
    const submission = Submission.createSubmission(ownerID, assignmentID, submissionDate, submissionType);

    // Get submission list by owner...
    let ownedSubmissions = submissionMapping.get(ownerID);
    if (!ownedSubmissions) submissionMapping.set(ownerID, ownedSubmissions = new Map());

    // If there exists submissions by the owner for this assignment already...
    if (ownedSubmissions.has(assignmentID))
    {
        // Get the other submissions already processed for the same assignment...
        const assignedSubmissions = ownedSubmissions.get(assignmentID);

        // Insert into appropriate order...
        let i = 0;
        for(; i < assignedSubmissions.length; ++i)
        {
            if (compareDates(assignedSubmissions[i].date, submissionDate) < 0)
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
        ownedSubmissions.set(assignmentID, [submission]);
    }
}

module.exports = {
    SUBMISSION_KEY,
    setupDatabase,
    addSubmission
};