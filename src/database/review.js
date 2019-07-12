
function createSubmissionReview(submissionID, reviewID, reviewDate, reviewResult, reviewComment)
{
    return {
        submission: submissionID,
        id: reviewID,
        date: reviewDate,
        result: reviewResult,
        comment: reviewComment
    }
}

function addSubmissionReview()
{

}

module.exports = {
    createSubmissionReview,
    addSubmissionReview
};