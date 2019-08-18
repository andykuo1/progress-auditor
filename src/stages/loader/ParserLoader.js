const path = require('path');
const fs = require('fs');

/**
 * Assumes db is already initialized.
 * @param {Database} db The database to load parsers for.
 * @param {Object} config The config.
 */
export async function loadParsers(db, config)
{
    const registry = db._registry;
    let dst;
    if ('parsers' in registry && Array.isArray(registry.parsers))
    {
        dst = registry.parsers;
    }
    else
    {
        dst = registry.parsers = [];
    }

    if (!('parsers' in config))
    {
        return Promise.resolve(dst);
    }
    
    const errors = [];
    const inputParentPath = config.inputPath || '.';
    for(const parserConfig of config.parsers)
    {
        const filePath = parserConfig.filePath;
        const inputFile = parserConfig.inputFile;

        if (!filePath)
        {
            errors.push(`Invalid parser config:`, '=>', `Missing 'filePath' for parser.`, '<=');
            continue;
        }
        else if (!fs.existsSync(filePath))
        {
            errors.push(`Cannot find parser script file '${path.basename(filePath)}':`, '=>', `File does not exist: '${filePath}'.`,'<=');
            continue;
        }

        if (!inputFile)
        {
            errors.push(`Invalid parser config:`, '=>', `Missing 'inputFile' for parser '${filePath}'.`, '<=');
            continue;
        }

        const inputPath = path.resolve(inputParentPath, parserConfig.inputFile);
        if (!fs.existsSync(inputPath))
        {
            errors.push(`Cannot find parser input file '${path.basename(inputPath)}':`, '=>', `File does not exist: '${inputPath}'.`,'<=');
            continue;
        }

        let parser;
        try
        {
            parser = require(filePath);
        }
        catch(e)
        {
            errors.push(`Unable to import parser file:`, '=>', `File: '${filePath}'`, e, '<=');
            continue;
        }

        dst.push([parser, filePath, inputPath, parserConfig.opts]);
    }

    if (errors.length > 0)
    {
        return Promise.reject([`Failed to resolve parsers from config:`, '=>', errors, '<=']);
    }

    return Promise.resolve(dst);
}
