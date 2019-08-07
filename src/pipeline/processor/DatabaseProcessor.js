const path = require('path');

export async function processDatabase(db, config)
{
    // Try to auto-resolve any issues in the database...
    console.log(`......Helping you fix a few things...`);

    const resolverResults = [];
    for(const resolverConfig of config.resolvers)
    {
        const filePath = resolverConfig.filePath;
        const resolver = require(filePath);

        console.log(`.........Resolving with '${path.basename(resolverConfig.filePath)}'...`);
        resolverResults.push(resolver.resolve(db, resolverConfig.opts));
    }

    return Promise.all(resolverResults);
}
