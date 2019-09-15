import * as ReviewRegistry from '../../input/review/ReviewRegistry.js';
import * as NullReviewer from './reviewer/NullReviewer.js';
import * as VacationReviewer from './reviewer/VacationReviewer.js';
import * as TemporaryReviewer from './reviewer/TemporaryReviewer.js';

import * as ResolverRegistry from '../../input/review/ResolverRegistry.js';

// Order does NOT matter!
export const REVIEWERS = [
    NullReviewer,
    VacationReviewer,
    TemporaryReviewer,
];

// Order DOES matter!
export const RESOLVERS = [
];

export async function setup(db, config)
{
    for(const reviewer of REVIEWERS)
    {
        ReviewRegistry.registerReviewer(reviewer);
    }

    for(const resolver of RESOLVERS)
    {
        ResolverRegistry.registerResolver(resolver);
    }
}
