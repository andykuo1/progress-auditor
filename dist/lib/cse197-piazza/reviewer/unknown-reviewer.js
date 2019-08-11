async function review(db, reviewID, reviewType, reviewParams)
{
    db.throwError(`[UNKNOWN_REVIEW] Unknown review type '${reviewType}'.`);
}

module.exports = {
    review
};
