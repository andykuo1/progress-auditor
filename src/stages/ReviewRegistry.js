const REVIEWERS = new Map();

export function registerReviewer(reviewer)
{
    REVIEWERS.set(reviewer.REVIEW_TYPE, reviewer);
}

export function hasReviewerByType(type)
{
    return REVIEWERS.has(type);
}

export function getReviewerByType(type)
{
    if (REVIEWERS.has(type))
    {
        return REVIEWERS.get(type);
    }
    else
    {
        return REVIEWERS.get('null');
    }
}

export function getReviewers()
{
    return REVIEWERS.values();
}
