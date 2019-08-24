import * as PiazzaResolvers from '../../lib/piazza/PiazzaResolvers.js';

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
            return PiazzaResolvers.resolve(db, config);
        default:
            throw new Error(`Unknown scheme - ${scheme}`);
    }
}
