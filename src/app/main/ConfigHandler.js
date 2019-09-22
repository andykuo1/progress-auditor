import * as Client from '../../client/Client.js';
import * as ConfigLoader from '../../config/ConfigLoader.js';
import * as DateUtil from '../../util/DateUtil.js';
import * as ConfigParamResolver from '../client/ConfigParamResolver.js';

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
        outputAutoDate: true,
        debug: false,
    }
}

export async function createNewConfig(directory)
{
    return null;
}

export async function validateConfig(config, directory)
{
    const fs = require('fs');
    const path = require('path');
    const chalk = require('chalk');

    if (!config.inputPath || !fs.existsSync(config.inputPath))
    {
        Client.log(chalk.yellow("Missing valid input path..."));
        config.inputPath = await ConfigParamResolver.resolveInputPath(directory);
    }

    if (!config.outputPath || !fs.existsSync(config.outputPath))
    {
        Client.debug("Missing valid output path...using working directory instead.");
        config.outputPath = directory;
    }

    if (!config.scheme)
    {
        Client.log(chalk.yellow("Missing scheme..."));
        const scheme = await ConfigParamResolver.resolveScheme();
        config.scheme = scheme;
    }

    if (!config.assignments)
    {
        Client.log(chalk.yellow("Missing assignment entries..."));
        const absInputPath = path.resolve(directory, config.inputPath);
        config.assignments = await ConfigParamResolver.resolveAssignments(absInputPath);
    }

    if (!config.inputs)
    {
        Client.log(chalk.yellow("Missing input entries..."));
        const absInputPath = path.resolve(directory, config.inputPath);
        config.inputs = await ConfigParamResolver.resolveInputs(absInputPath);
    }

    if (!config.outputs)
    {
        Client.log(chalk.yellow("Missing output entries..."));
        const absOutputPath = path.resolve(directory, config.outputPath);
        config.outputs = await ConfigParamResolver.resolveOutputs(absOutputPath);
    }

    if (!config.currentDate)
    {
        Client.log(chalk.yellow("Missing current date..."));
        const date = await ConfigParamResolver.resolveDate();
        config.currentDate = DateUtil.stringify(date);
    }
}