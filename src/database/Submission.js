/**
 * @param {String} submissionID A globally unique identifier for this submission data object.
 * @param {String} ownerKey The owner of the submission.
 * @param {String} assignmentID The assignment the submission is for.
 * @param {Date} submitDate The date the submission was submitted.
 * @param {Object} attributes Any additional properties.
 * @returns {Submission} The submission data object.
 */
export function createSubmission(submissionID, ownerKey, assignmentID, submitDate, attributes={})
{
    return {
        id: submissionID,
        owner: ownerKey,
        assignment: assignmentID,
        date: submitDate,
        attributes,
    };
}
