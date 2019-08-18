const path = require('path');
const fs = require('fs');

/**
 * Assumes db is already initialized.
 * @param {Database} db The database to load resolvers for.
 * @param {Object} config The config.
 */
export async function loadResolvers(db, config)
{
    const registry = db._registry;
    let dst;
    if ('resolvers' in registry && Array.isArray(registry.resolvers))
    {
        dst = registry.resolvers;
    }
    else
    {
        dst = registry.resolvers = [];
    }

    if (!('resolvers' in config))
    {
        return Promise.resolve(dst);
    }

    // Create assignments...
    const errors = [];
    for(const resolverConfig of config.resolvers)
    {
        const filePath = resolverConfig.filePath;

        if (!filePath)
        {
            errors.push(`Invalid resolver config:`, '=>', `Missing 'filePath' for resolver config.`, '<=');
            continue;
        }
        else if (!fs.existsSync(filePath))
        {
            errors.push(`Cannot find resolver script file '${path.basename(filePath)}':`, '=>', `File does not exist: '${filePath}'.`,'<=');
            continue;
        }

        let resolver;
        try
        {
            resolver = require(filePath);
        }
        catch(e)
        {
            errors.push(`Unable to import resolver file:`, '=>', `File: '${filePath}'`, e, '<=');
            continue;
        }

        dst.push([resolver, filePath, resolverConfig.opts]);
    }

    if (errors.length > 0)
    {
        return Promise.reject([`Failed to resolve resolvers from config:`, '=>', errors, '<=']);
    }

    return Promise.resolve(dst);
}
