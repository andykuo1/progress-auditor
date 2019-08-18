/**
 * Assumes resolvers have already been loaded.
 * @param {Database} db The database to resolve data for.
 * @param {Object} config The config.
 */
export async function processDatabase(db, config)
{
    const registry = db._registry;
    if (!('resolvers' in registry) || !Array.isArray(registry.resolvers))
    {
        return Promise.resolve([]);
    }
    
    // Resolve database...
    const resolverResults = [];
    for(const resolverEntry of registry.resolvers)
    {
        const [resolver, filePath, opts] = resolverEntry;
        // console.log(`.........Resolving with '${path.basename(resolverConfig.filePath)}'...`);
        resolverResults.push(resolver.resolve(db, opts));
    }

    return Promise.all(resolverResults);
}
