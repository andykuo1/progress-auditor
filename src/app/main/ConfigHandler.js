import * as Client from '../../client/Client.js';
import * as ConfigLoader from '../../config/ConfigLoader.js';
import * as ConfigHelper from '../../client/ConfigHelper.js';
import * as DateUtil from '../../util/DateUtil.js';

/** If unable to load config file, null is returned. */
export async function loadConfigFile(filepath)
{
    console.log("...Load config...");
    return await ConfigLoader.loadConfig(filepath);
}

/** If unable to request config file, null is returned. */
export async function requestConfigFile(directory)
{
    console.log("...Request config...");
    return null;
    // return await ClientHandler.askForConfigFilePath(directory);
}

/** If unable to load default config file, null is returned. */
export async function loadDefaultConfig(directory)
{
    console.log("...Load default config...");
    return {
        scheme: 'piazza',
        outputAutoDate: true,
        debug: false,
        assignments: [
            {
                assignmentName: 'intro',
                pattern: 'intro',
                opts: {}
            },
            {
                assignmentName: 'week',
                pattern: 'sunday',
                opts: {}
            },
            {
                assignmentName: 'last',
                pattern: 'last',
                opts: {}
            }
        ]
    }
    return null;
}

export async function createNewConfig(directory)
{
    return null;
    /*
    // TODO: ConfigMaker is just not ready :(
    if (await ClientHandler.askWhetherToMakeNewConfig())
    {
        return ConfigMaker.run(directory);
    }
    else
    {
        return null;
    }
    */
}

export async function validateConfig(config, directory)
{
    const fs = require('fs');
    const path = require('path');
    const chalk = require('chalk');

    if (!config.inputPath || !fs.existsSync(config.inputPath))
    {
        Client.log(chalk.yellow("Missing valid input path..."));
        config.inputPath = await ConfigHelper.resolveInputPath(directory);
    }

    if (!config.outputPath || !fs.existsSync(config.outputPath))
    {
        Client.debug("Missing valid output path...using working directory instead.");
        config.outputPath = directory;
    }

    if (!config.assignments)
    {
        Client.log(chalk.yellow("Missing assignment entries..."));
        const absInputPath = path.resolve(directory, config.inputPath);
        config.assignments = await ConfigHelper.resolveAssignments(absInputPath);
    }

    if (!config.inputs)
    {
        Client.log(chalk.yellow("Missing input entries..."));
        const absInputPath = path.resolve(directory, config.inputPath);
        config.inputs = await ConfigHelper.resolveInputs(absInputPath);
    }

    if (!config.outputs)
    {
        Client.log(chalk.yellow("Missing output entries..."));
        const absOutputPath = path.resolve(directory, config.outputPath);
        config.outputs = await ConfigHelper.resolveOutputs(absOutputPath);
    }

    if (!config.currentDate)
    {
        Client.log(chalk.yellow("Missing current date..."));
        const date = await ConfigHelper.resolveDate();
        config.currentDate = DateUtil.stringify(date);
    }
}