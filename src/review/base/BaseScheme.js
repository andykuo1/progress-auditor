import * as AssignmentChangeStatusReview from './AssignmentChangeStatusReview.js';
import * as SubmissionAddReview from './SubmissionAddReview.js';
import * as SubmissionChangeAssignmentReview from './SubmissionChangeAssignmentReview.js';
import * as SubmissionChangeDateReview from './SubmissionChangeDateReview.js';
import * as SubmissionIgnoreOwnerReview from './SubmissionIgnoreOwnerReview.js';
import * as SubmissionIgnoreReview from './SubmissionIgnoreReview.js';
import * as UserAddOwnerReview from './UserAddOwnerReview.js';

import * as NullReview from './NullReview.js';
import * as EmptyReview from './EmptyReview.js';
import * as IgnoreReview from './IgnoreReview.js';
// import * as VacationReview from './VacationReview.js';

export async function setup(db, config, reviewRegistry)
{
    reviewRegistry
        // NOTE: Must be first. (however, this won't apply for vacation reviews, look at VacationReview for solution)
        .register(IgnoreReview)
        // NOTE: Order determines execution order, but these
        // reviews shouldn't care about that.
        .register(EmptyReview)
        .register(UserAddOwnerReview)
        .register(SubmissionChangeAssignmentReview)
        .register(SubmissionChangeDateReview)
        .register(SubmissionIgnoreOwnerReview)
        .register(SubmissionIgnoreReview)
        .register(SubmissionAddReview)
        .register(AssignmentChangeStatusReview)
        .register(NullReview)
    
    // NOTE: VacationReview is handled externally at data population by DatabaseHandler.
    // This is due to a dependency that we cannot get rid of if we want
    // vacation data to live inside the review file.
}
