/**
 * This file is used to specifically load the input entries from the config file.
 * 
 * @module InputLoader
 */

import * as ParserLoader from '../../../input/parser/ParserLoader.js';
import * as ParserRegistry from '../../../input/parser/ParserRegistry.js';
import path from 'path';
import fs from 'fs';

/** If unable to find entries, an empty array is returned. */
export async function findInputEntries(config)
{
    console.log("...Finding input entries...");
    if (Array.isArray(config.inputs))
    {
        const result = config.inputs;

        // Validate input entries...
        const errors = [];
        for(const inputEntry of result)
        {
            try
            {
                validateInputEntry(config, inputEntry);
            }
            catch(e)
            {
                errors.push(e);
            }
        }

        if (errors.length > 0)
        {
            throw new Error([
                'Failed to resolve input entries from config:',
                '=>',
                errors,
                '<='
            ]);
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
    console.log(`...Process input entry '${inputEntry.inputName}'...`);
    const inputPath = config.inputPath || '.';
    const inputName = inputEntry.inputName;
    const filePath = path.resolve(inputPath, inputName);
    const parserType = inputEntry.parser;
    const customPath = inputEntry.customPath;
    const opts = inputEntry.opts || {};

    let Parser;
    try
    {
        // customPath will override parserType if defined.
        if (customPath)
        {
            Parser = ParserLoader.loadCustomParser(customPath);
        }
        else
        {
            Parser = ParserLoader.loadParserByType(parserType);
        }
    }
    catch(e)
    {
        throw new Error([
            `Failed to resolve input entry from config:`,
            '=>',
            e,
            '<='
        ]);
    }

    ParserRegistry.registerParser(Parser, filePath, customPath || parserType, opts);
}

function validateInputEntry(config, inputEntry)
{
    const errors = [];

    const inputPath = config.inputPath || '.';
    const inputName = inputEntry.inputName;
    const inputFilePath = path.resolve(inputPath, inputName);
    const parserType = inputEntry.parser;
    const customPath = inputEntry.customPath;

    if (!inputName)
    {
        errors.push([
            'Invalid input entry:',
            '=>',
            `Missing required property 'inputName'.`,
            '<='
        ]);
    }

    if (!fs.existsSync(inputFilePath))
    {
        // This is not an error, it should simply skip it...
        /*
        errors.push([
            `Cannot find input file '${inputName}':`,
            '=>',
            `File does not exist: '${inputFilePath}'.`,
            '<='
        ]);
        */
    }

    if (!parserType && !customPath)
    {
        errors.push([
            'Invalid input entry:',
            '=>',
            `Missing one of property 'parser' or 'customPath'.`,
            '<='
        ]);
    }

    if (customPath && !fs.existsSync(customPath))
    {
        errors.push([
            `Cannot find custom parser file '${path.basename(customPath)}':`,
            '=>',
            `File does not exist: '${customPath}'.`,
            '<='
        ]);
    }

    if (errors.length > 0)
    {
        throw new Error([
            'Failed to validate input entry:',
            '=>',
            errors,
            '<='
        ]);
    }
}