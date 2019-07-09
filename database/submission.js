function createSubmission(ownerID, submissionID, submissionDate, submissionContent)
{
    return {
        owner: ownerID,
        id: submissionID,
        date: submissionDate,
        content: submissionContent
    };
}

function addSubmission(db, submission)
{
    if (db.submission.has(submission.id))
    {
        throw new Error(`Failed to add user with id ${submission.id} - Found duplicate user id.`);
    }
    else
    {
        db.submission.set(submission.id, submission);
    }
}

module.exports = {
    createSubmission,
    addSubmission
};