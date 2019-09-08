import * as CohortParser from '../input/CohortParser.js';
import * as ContributionsParser from '../input/ContributionsParser.js';

/** If unable to find entries, an empty array is returned. */
export async function findInputEntries(config)
{
    if (Array.isArray(config.inputs))
    {
        return config.inputs;
    }
    else
    {
        return [];
    }
}

/** Guaranteed to load input entry. Will throw an error if failed. */
export async function loadInputEntry(db, config, inputEntry)
{
    const filePath = inputEntry.filePath;
    const parserType = inputEntry.parser;
    const customParserPath = inputEntry.customParserPath;
    const opts = inputEntry.opts;

    let Parser;

    // If customParserPath is defined, ignore parserType.
    if (customParserPath)
    {
        try
        {
            Parser = require(customParserPath);
            if (typeof Parser.parse !== 'function')
            {
                throw new Error(`Invalid custom parser '${customParserPath}' - must export named function 'parse'.`);
            }
        }
        catch(e)
        {
            throw new Error(`Cannot load custom parser from '${customParserPath}'.`, e);
        }
    }
    // No customParserPath, so use parserType.
    else
    {
        switch(parserType)
        {
            case 'cohort':
                Parser = CohortParser;
                break;
            case 'contributions':
                Parser = ContributionsParser;
                break;
            default:
                throw new Error(`Cannot find valid parser of type '${parserType}'.`);
        }
    }

    await Parser.parse(db, config, filePath, opts);
}