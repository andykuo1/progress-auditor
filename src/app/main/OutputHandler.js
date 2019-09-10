import * as InstructorReportOutput from '../../output/InstructorReportOutput.js';
import * as StudentReportOutput from '../../output/StudentReportOutput.js';
import * as DebugReportOutput from '../../output/DebugReportOutput.js';
import * as DateUtil from '../../util/DateUtil.js';

import * as ClientHandler from '../client/ClientHandler.js';

const path = require('path');

export function findOutputEntries(config)
{
    console.log("...Finding output entries...");
    if (Array.isArray(config.outputs))
    {
        return config.outputs;
    }
    else
    {
        return [];
    }
}

export async function processOutputEntry(db, config, outputEntry)
{
    console.log("...Process output entry...");
    const outputPath = config.outputPath;
    const outputName = outputEntry.outputName;
    const outputAutoDate = config.outputAutoDate || false;
    const filePath = path.resolve(outputPath + (outputAutoDate ? '/' + DateUtil.stringify(db.currentDate, false) : ''), outputName);
    const formatType = outputEntry.format;
    const customFormatPath = outputEntry.customFormatPath;
    const opts = outputEntry.opts;

    let Format;

    // If customFormatPath is defined, ignore formatType.
    if (customFormatPath)
    {
        try
        {
            Format = require(customFormatPath);
            if (typeof Format.output !== 'function')
            {
                throw new Error(`Invalid custom format '${customFormatPath}' - must export named function 'output'.`);
            }
        }
        catch(e)
        {
            throw new Error(`Cannot load custom format from '${customFormatPath}'.`, e);
        }
    }
    // No customFormatPath, so use formatType.
    else
    {
        switch(formatType)
        {
            case 'instructor':
                Format = InstructorReportOutput;
                break;
            case 'student':
                Format = StudentReportOutput;
                break;
            case 'debug':
                Format = DebugReportOutput;
                break;
            default:
                throw new Error(`Cannot find valid output of type '${formatType}'.`);
        }
    }

    await Format.output(db, config, filePath, opts);
}

export async function outputDebugLog(db, config)
{
    if (await ClientHandler.askWhetherToSaveDebugInfo())
    {
        const outputPath = config.outputPath;
        const outputAutoDate = config.outputAutoDate || false;
        const filePath = outputPath + (outputAutoDate ? '/' + DateUtil.stringify(db.currentDate, false) : '');
        await DebugReportOutput.output(db, config, filePath);
    }
    else
    {
        ClientHandler.showSkippingDebugLog();
    }
}
