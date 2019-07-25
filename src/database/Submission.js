function createSubmission(ownerKey, assignmentID, submitDate, attributes={})
{
    return {
        owner: ownerKey,
        assignment: assignmentID,
        date: submitDate,
        attributes,
    };
}

module.exports = {
    createSubmission
};
