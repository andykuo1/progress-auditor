import { version } from '../../package.json';
import * as Client from '../client/Client.js';
import * as DatabaseSolver from './main/DatabaseSolver.js';

export async function onStart(directory, args)
{
    Client.doTheBigTitleThing('Progress Auditor', `Version v${version}`);
    Client.log('');

    Client.log('Running from directory: ' + directory);
    Client.log('');
}

export async function onSetup(db, config)
{
    /**
     * Loading - Where all data should be loaded from file. This
     * should be raw data as defined by the user. No modifications
     * should take place; they will be considered for alterations
     * in the processing stage.
     */
}

export async function onPreProcess(db, config)
{
    /**
     * Processing - Where all data is evaluated and processed into
     * valid and useful information. This is also where most of the
     * errors not related to IO will be thrown. This stage consists
     * of two steps: the review and the resolution. The resolution
     * step will attempt to automatically format and validate the
     * data. If it is unable to then the data is invalid and is
     * flagged for review by the user. Therefore, the review step,
     * which processes all user-created reviews, is computed before
     * the resolution. This is a frequent debug loop.
     */
}

export async function onPostProcess(db, config)
{

}

export async function onOutput(db, config)
{
    /**
     * Outputting - Where all data is outputted into relevant
     * files. If any errors had occured, it will exit-early and
     * output any gathered debug information.
     */
}

export async function onError(db, config, error)
{
    Client.formattedError(error, (config && config.debug) || false);
    
    try
    {
        // Last ditch attempt to save progress...
        DatabaseSolver.outputErrorLog(db, config, [error]);
    }
    catch(e) {}
}

export async function onStop(db, config)
{

}
