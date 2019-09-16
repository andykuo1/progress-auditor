import * as ConfigLoader from '../../config/ConfigLoader.js';

import * as ClientHandler from '../client/ClientHandler.js';

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
    return await ClientHandler.askForConfigFilePath(directory);
}

/** If unable to load default config file, null is returned. */
export async function loadDefaultConfig(directory)
{
    console.log("...Load default config...");
    // No default config allowed.
    /*
    return {
        scheme: 'piazza',
        inputPath: '.',
        outputPath: './out/',
        assignmnets: [],
        inputs: [],
        outputs: [],
    };
    */
    return null;
}

export async function createNewConfig(directory)
{
    if (await ClientHandler.askWhetherToMakeNewConfig())
    {
        // TODO: This should be the config maker here.
        // return ConfigMaker.run(directory, true);
        return null;
    }
    else
    {
        return null;
    }
}
