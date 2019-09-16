import * as SubmissionAssignmentByHeaderReview from './SubmissionAssignmentByHeaderReview.js';
import * as SubmissionAssignmentByIntroReview from './SubmissionAssignmentByIntroReview.js';
import * as SubmissionAssignmentByPostIDReview from './SubmissionAssignmentByPostIDReview.js';
import * as SubmissionSlipDaysReview from './SubmissionSlipDaysReview.js';
import * as BaseScheme from '../base/BaseScheme.js';

export const SCHEME_NAME = 'piazza';

export async function setup(db, config, reviewRegistry)
{
    await BaseScheme.setup(db, config, reviewRegistry);
    
    reviewRegistry
        /** Order matters here... */
        .register(SubmissionAssignmentByPostIDReview)
        .register(SubmissionAssignmentByIntroReview)
        .register(SubmissionAssignmentByHeaderReview)
        .register(SubmissionSlipDaysReview);
}