import * as SubmissionAssignmentByHeaderReview from './SubmissionAssignmentByHeaderReview.js';
import * as SubmissionAssignmentByIntroReview from './SubmissionAssignmentByIntroReview.js';
import * as SubmissionAssignmentByLastReview from './SubmissionAssignmentByLastReview.js';
import * as SubmissionAssignmentByPostNumberReview from './SubmissionAssignmentByPostNumberReview.js';
import * as SubmissionSlipDaysReview from './SubmissionSlipDaysReview.js';
import * as BaseScheme from '../base/BaseScheme.js';

export const SCHEME_NAME = 'piazza';

export async function setup(db, config, reviewRegistry)
{
    await BaseScheme.setup(db, config, reviewRegistry);
    
    reviewRegistry
        // Order matters here...
        .register(SubmissionAssignmentByIntroReview)
        .register(SubmissionAssignmentByLastReview)
        .register(SubmissionAssignmentByHeaderReview)
        // This must go after all assignment resolution reviews.
        .register(SubmissionAssignmentByPostNumberReview)
        // This must go LAST.
        .register(SubmissionSlipDaysReview);
}