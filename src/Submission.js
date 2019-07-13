const SUBMISSION_TYPE_UNKNOWN = 'unknown';
const SUBMISSION_TYPE_SOURCE = 'source';
const SUBMISSION_TYPE_MINOR_EDIT = 'minor';
const SUBMISSION_TYPE_MAJOR_EDIT = 'major';

function createSubmission(ownerID, assignmentID, submissionDate, submissionType=SUBMISSION_TYPE_UNKNOWN)
{
    return {
        owner: ownerID,
        assignment: assignmentID,
        date: submissionDate,
        type: submissionType
    };
}

function calculateContentDifference(sourceSubmissionContent, updatedSubmissionContent)
{
    return 0;
}

module.exports = {
    createSubmission,
    calculateContentDifference,
    SUBMISSION_TYPE_MAJOR_EDIT,
    SUBMISSION_TYPE_MINOR_EDIT,
    SUBMISSION_TYPE_SOURCE,
    SUBMISSION_TYPE_UNKNOWN
};