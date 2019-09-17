const ERROR_TAG = 'REVIEW';

function throwSafeError(db, source, message, errorClass = source.id, opts = {})
{
    db.throwError(ERROR_TAG, message, {
        id: [source.id, source.type],
        type: errorClass,
        ...opts
    });
}

export function throwInvalidReviewParamSubmissionIDError(db, source, submissionID)
{
    return throwSafeError(
        db,
        source,
        `Invalid review param - unable to find submission for id '${submissionID}'.`,
        'review_param_submission_id',
        {
            options: [
                'The submission for that id is missing from the database.',
                `Or the id is wrong. Try fixing the review file or ignore the review.`
            ],
            context: {
                // Used by ignore_review
                reviewID: source.id,
                // Used by... nobody yet
                submissionID,
            }
        }
    );
}

export function throwInvalidReviewParamUserIDError(db, source, userID)
{
    return throwSafeError(
        db,
        source,
        `Invalid review param - Cannot find user for id '${userID}'.`,
        'review_param_user_id',
        {
            options: [
                `User with this id is missing from the database.`,
                `Or the id is wrong.`
            ],
            context: {
                // Used by ignore_review
                reviewID: source.id,
                // Used by... nobody yet
                userID,
            }
        }
    );
}

export function throwInvalidReviewParamOwnerKeyError(db, source, ownerKey)
{
    return throwSafeError(
        db,
        source,
        `Invalid review param - Cannot find user for owner key '${ownerKey}'.`,
        'review_param_owner_key',
        {
            options: [
                `Add missing owner key to a user.`
            ],
            context: {
                // Used by ignore_review
                reviewID: source.id,
                // Used by add_owner_key, ignore_owner
                ownerKey,
            }
        }
    );
}

export function throwInvalidReviewParamAssignmentIDError(db, source, assignmentID)
{
    return throwSafeError(
        db,
        source,
        `Invalid review param - Cannot find assignment for id '${assignmentID}'.`,
        'review_param_assignment_id',
        {
            options: [
                `User may not be assigned this assignment.`,
                `Assignment id may not exist.`
            ],
            context: {
                // Used by ignore_review
                reviewID: source.id,
                // Used by...nobody
                assignmentID,
            }
        }
    );
}

export function throwUnassignedSubmissionError(db, source, userID, assignmentID, submission)
{
    return throwSafeError(
        db,
        source,
        `Found unassigned submission '${submission.id}' for assignment '${assignmentID}' from user '${userID}'.`,
        'unassigned_submission',
        {
            info: submission.attributes.content.head,
            options: [
                `The submission header could be ill-formatted. We could not deduce its appropriate assignment automatically. Please verify the submitted content and header formats. Try submitting a 'change_assignment' review once you figure out its proper assignment.`,
                `It could be a non-assignment submission. Try submitting a 'ignore_submission' review.`
            ],
            more: [
                JSON.stringify(submission, null, 4)
            ],
            context: {
                // Used by ignore_submission, change_assignment
                submissionID: submission.id,
            }
        }
    );
}

export function throwUnownedSubmissionError(db, source, ownerKey, submissions)
{
    let submissionCount = 0;
    for(const assignmentID of Object.keys(submissions))
    {
        submissionCount += submissions[assignmentID].length;
    }
    
    return throwSafeError(
        db,
        source,
        `Found ${submissionCount} unowned submissions - cannot find user for owner key '${ownerKey}'.`,
        'unowned_submission',
        {
            options: [
                `There are submissions without a valid user associated with it. Perhaps someone is using a different owner key? Try submitting a 'add_owner' review once you've found who these submissions belong to.`,
                `The owner key may be ill-formatted. Instead of fixing the mispelling, try submitting a 'add_owner' review to associate it back to the user.`
            ],
            more: [
                JSON.stringify(submissions, null, 4)
            ],
            context: {
                // Used by add_owner_key
                ownerKey: ownerKey,
            }
        }
    );
}
