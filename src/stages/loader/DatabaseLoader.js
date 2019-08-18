const path = require('path');

/**
 * Assumes parsers have already been loaded.
 * @param {Database} db The database to load data into.
 * @param {Object} config The config.
 */
export async function loadDatabase(db, config)
{
    const registry = db._registry;
    if (!('parsers' in registry) || !Array.isArray(registry.parsers))
    {
        return Promise.resolve([]);
    }
    
    // Populate databases...
    const parserResults = [];
    for(const parserEntry of registry.parsers)
    {
        const [parser, filePath, inputPath, opts] = parserEntry;
        console.log(`......Parsing '${path.basename(inputPath)}' with '${path.basename(filePath)}'...`);
        parserResults.push(parser.parse(db, inputPath, opts));
    }

    return Promise.all(parserResults);
}
