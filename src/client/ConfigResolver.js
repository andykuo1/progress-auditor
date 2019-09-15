import { log, askPath } from './Client.js';
import { createResolver, ifFailAndAgain } from './Resolver.js';
import * as ConfigMaker from './ConfigMaker.js';

async function searchDirectoryForConfigFile(directoryPath)
{
    log("Searching for config in directory...");
    let result = null;
    log("...no config found...");
    return null;
}

/** Tries to resolve a config object. */
export async function run(directory, cache = {})
{
    cache.workingDirectory = directory;
    cache.currentDirectory = directory;
    cache.configMaker = {};

    /**
     * First, try to find it in the working directory.
     * If it is not there, maybe they want to change directory?
     * Search for it there.
     * If not, maybe they want to make a new config.
     * Fill out the config form.
     * Do they want to save it somewhere?
     * Return anything we have.
     */

    let result = null;

    result = await searchDirectoryForConfigFile(cache.workingDirectory);
    if (result) return result;

    result = await createResolver()
        .init("Change working directory?")
        .run(async () =>
        {
            const path = await askPath("Directory path", true, true);
            if (path)
            {
                cache.currentDirectory = path;
                return await searchDirectoryForConfigFile(path);
            }
        })
        .again(ifFailAndAgain("Try a different directory?"))
        .resolve();
    if (result) return result;
    log("...could not find one...");

    result = await ConfigMaker.run(cache.configMaker);
    if (result) return result;
    log("...could not make one...");

    log("That's all folks. Sayonara.");
    return { sad: true };
}
