function createSubmission(ownerID, assignmentID, submitDate, attributes={})
{
    return {
        owner: ownerID,
        assignment: assignmentID,
        date: submitDate,
        attributes,
    };
}

module.exports = {
    createSubmission
};
