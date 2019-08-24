import * as AssignSubmissionByPostIDResolver from '../../lib/piazza/resolver/AssignSubmissionByPostIDResolver.js';
import * as AssignSubmissionByIntroResolver from '../../lib/piazza/resolver/AssignSubmissionByIntroResolver.js';
import * as AssignSubmissionResolver from '../../lib/piazza/resolver/AssignSubmissionResolver.js';
import * as SlipDayResolver from '../../lib/piazza/resolver/SlipDayResolver.js';

/**
 * Assumes resolvers have already been loaded.
 * @param {Database} db The database to resolve data for.
 * @param {Object} config The config.
 */
export async function processDatabase(db, config)
{
    const scheme = config.scheme;

    // Resolve database...
    switch(scheme)
    {
        case 'piazza':
            // console.log(`.........Resolving with '${path.basename(resolverConfig.filePath)}'...`);
            return Promise.all([
                AssignSubmissionByPostIDResolver.resolve(db, opts),
                AssignSubmissionByIntroResolver.resolve(db, opts),
                AssignSubmissionResolver.resolve(db, opts),
                SlipDayResolver.resolve(db, opts),
            ]);
        default:
            throw new Error(`Unknown scheme - ${scheme}`);
    }
}
