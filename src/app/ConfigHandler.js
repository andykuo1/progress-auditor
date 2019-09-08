import * as ConfigLoader from '../config/ConfigLoader.js';
import * as ClientHandler from './ClientHandler.js';

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
    return {
        scheme: 'piazza',
        inputPath: '.',
        outputPath: './out/',
        inputs: [],
        outputs: [],
    };
}
