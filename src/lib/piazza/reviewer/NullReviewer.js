export const REVIEW_TYPE = 'unknown';
export const REVIEW_DESC = 'Unknown review type.';
export const REVIEW_PARAM_TYPES = [];

export async function review(db, reviewID, reviewType, reviewParams)
{
    db.throwError(`Unhandled review type ${reviewType} for review '${reviewID}'.`, {
        id: [reviewID, reviewType],
        options: [
            `You probably misspelled the review type.`,
            `Ask the developer to handle a new '${reviewType}' review type.`
        ]
    });
}
