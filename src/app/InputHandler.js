import * as ParserLoader from '../input/ParserLoader.js';
import * as ErrorHandler from '../app/ErrorHandler.js';

const fs = require('fs');
const path = require('path');

function validateInputEntry(config, inputEntry)
{
    const ERROR = ErrorHandler.createErrorBuffer();

    const inputPath = config.inputPath || '.';
    const inputName = inputEntry.inputName;
    const inputFilePath = path.resolve(inputPath, inputName);
    const parserType = inputEntry.parser;
    const customParserPath = inputEntry.customParserPath;

    if (!inputName)
    {
        ERROR.add('Invalid input entry:', `Missing required property 'inputName'.`);
    }

    if (!fs.existsSync(inputFilePath))
    {
        ERROR.add(`Cannot find input file '${inputName}':`, `File does not exist: '${inputFilePath}'.`);
    }

    if (!parserType && !customParserPath)
    {
        ERROR.add('Invalid input entry:', `Missing one of property 'parser' or 'customParserType'.`);
    }

    if (customParserPath && !fs.existsSync(customParserPath))
    {
        ERROR.add(`Cannot find custom parser file '${path.basename(customParserPath)}':`, `File does not exist: '${customParserPath}'.`);
    }

    if (!ERROR.isEmpty())
    {
        ERROR.flush('Failed to validate input entry:');
    }
}

/** If unable to find entries, an empty array is returned. */
export async function findInputEntries(config)
{
    console.log("...Finding input entries...");
    if (Array.isArray(config.inputs))
    {
        const result = config.inputs;

        // Validate input entries...
        const ERROR = ErrorHandler.createErrorBuffer();
        for(const inputEntry of result)
        {
            try
            {
                validateInputEntry(config, inputEntry);
            }
            catch(e)
            {
                ERROR.add(e);
            }
        }

        if (!ERROR.isEmpty())
        {
            ERROR.flush('Failed to resolve input entries from config:');
        }
        else
        {
            return result;
        }
    }
    else
    {
        return [];
    }
}

/**
 * Guaranteed to load input entry. Will throw an error if failed.
 * Also assumes that inputEntry is valid.
 */
export async function loadInputEntry(db, config, inputEntry)
{
    console.log("...Process input entry...");
    const inputPath = config.inputPath || '.';
    const inputName = inputEntry.inputName;
    const filePath = path.resolve(inputPath, inputName);
    const parserType = inputEntry.parser;
    const customParserPath = inputEntry.customParserPath;
    const opts = inputEntry.opts || {};

    let Parser;

    const ERROR = ErrorHandler.createErrorBuffer();
    try
    {
        // customParserPath will override parserType if defined.
        if (customParserPath)
        {
            Parser = ParserLoader.loadCustomParser(customParserPath);
        }
        else
        {
            Parser = ParserLoader.loadParserByType(parserType);
        }
    }
    catch(e)
    {
        ERROR.add(e);
    }

    if (!ERROR.isEmpty())
    {
        ERROR.flush(`Failed to resolve input entry from config:`);
    }
    else
    {
        await Parser.parse(db, config, filePath, opts);
    }
}
