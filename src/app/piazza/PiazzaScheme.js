import * as ReviewRegistry from '../../review/ReviewRegistry.js';
import * as NullReviewer from './reviewer/NullReviewer.js';
import * as SubmissionChangeAssignmentReviewer from './reviewer/SubmissionChangeAssignmentReviewer.js';
import * as SubmissionIgnoreOwnerReviewer from './reviewer/SubmissionIgnoreOwnerReviewer.js';
import * as SubmissionIgnoreReviewer from './reviewer/SubmissionIgnoreReviewer.js';
import * as SubmissionAddReviewer from './reviewer/SubmissionAddReviewer.js';
import * as UserAddOwnerKeyReviewer from './reviewer/UserAddOwnerKeyReviewer.js';
import * as AssignmentChangeStatusReviewer from './reviewer/AssignmentChangeStatusReviewer.js';

import * as ProcessorPipeline from '../../review/ProcessorPipeline.js';
import * as AssignSubmissionByPostIDResolver from './resolver/AssignSubmissionByPostIDResolver.js';
import * as AssignSubmissionByIntroResolver from './resolver/AssignSubmissionByIntroResolver.js';
import * as AssignSubmissionResolver from './resolver/AssignSubmissionResolver.js';
import * as SlipDayResolver from './resolver/SlipDayResolver.js';

export const SCHEME_NAME = 'piazza';

// Order does NOT matter!
export const REVIEWERS = [
    NullReviewer,
    UserAddOwnerKeyReviewer,
    SubmissionChangeAssignmentReviewer,
    SubmissionIgnoreOwnerReviewer,
    SubmissionIgnoreReviewer,
    SubmissionAddReviewer,
    AssignmentChangeStatusReviewer
];

// Order DOES matter!
export const RESOLVERS = [
    AssignSubmissionByPostIDResolver,
    AssignSubmissionByIntroResolver,
    AssignSubmissionResolver,
    SlipDayResolver,
];

export async function setup(db, config)
{
    for(const reviewer of REVIEWERS)
    {
        ReviewRegistry.registerReviewer(reviewer);
    }

    for(const resolver of RESOLVERS)
    {
        ProcessorPipeline.addProcessor('post', resolver);
    }
}
