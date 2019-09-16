import * as InputLoader from './loader/InputLoader.js';
import * as ParserRegistry from '../../input/parser/ParserRegistry.js';
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
            // TODO: What to output if input file is missing?
            // TODO: What to output if input file cannot be parsed?
            // TODO: What to output if custom parser file is missing?
            // TODO: What to output if custom parser file is invalid?
            // TODO: What to output if parser type is missing?
            console.error('Failed to load input entry.', e);
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
            console.log(`...Skipping '${path.basename(filePath)}' (cannot find it)...`);
            continue;
        }
    }
}
