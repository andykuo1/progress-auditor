export function createReview(reviewID, reviewDate, comment, type, params)
{
    return {
        id: reviewID,
        date: reviewDate,
        comment,
        type,
        params
    };
}
