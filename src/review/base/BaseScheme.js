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
// NOTE: This is called BEFORE assignment data population in DatabaseHandler.
import * as VacationReview from './VacationReview.js';
// NOTE: This is called AFTER review data processing in ReviewHandler.
import * as SkipErrorReview from './SkipErrorReview.js';

export async function setup(db, config, reviewRegistry)
{
    reviewRegistry
        // NOTE: Must be first. (however, this won't apply for vacation reviews, look at VacationReview for solution)
        .register(IgnoreReview)
        // NOTE: The 2nd argument is an execution override. We don't want it to execute normally.
        .register(VacationReview, true)
        .register(SkipErrorReview, true)
        // NOTE: Order determines execution order, but these
        // reviews shouldn't care about that.
        .register(NullReview)
        .register(EmptyReview)
        .register(UserAddOwnerReview)
        .register(SubmissionChangeAssignmentReview)
        .register(SubmissionChangeDateReview)
        .register(SubmissionIgnoreOwnerReview)
        .register(SubmissionIgnoreReview)
        .register(SubmissionAddReview)
        .register(AssignmentChangeStatusReview)
    
    // NOTE: VacationReview is handled externally at data population by DatabaseHandler.
    // This is due to a dependency that we cannot get rid of if we want
    // vacation data to live inside the review file.
}
