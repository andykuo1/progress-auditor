import * as InputLoader from './loader/InputLoader.js';
import * as ParserRegistry from '../../input/parser/ParserRegistry.js';
import * as Client from '../../client/Client.js';
import path from 'path';
import fs from 'fs';

export async function loadInputsFromConfig(db, config)
{
    const inputEntries = await InputLoader.findInputEntries(config);
    for(const inputEntry of inputEntries)
    {
        try
        {
            await InputLoader.loadInputEntry(db, config, inputEntry);
        }
        catch(e)
        {
            await Client.skippedError(`Failed to load input entry '${inputEntry.inputName}'`, e);
        }
    }
}

export async function applyParsersToDatabase(db, config)
{
    for(const parser of ParserRegistry.getParsers())
    {
        const [parserFunction, filePath, parserType, opts] = parser;

        // File path is not GUARANTEED to exist...
        if (fs.existsSync(filePath))
        {
            console.log(`...Parsing '${path.basename(filePath)}' with '${path.basename(parserType)}'...`);
            await parserFunction.parse(db, config, filePath, opts);
        }
        else
        {
            await Client.skippedError(`Failed to find file '${path.basename(filePath)}' for parser`, new Error('File does not exist.'));
        }
    }
}
