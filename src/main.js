// TODO: This should be it's own bundled file for plugins to use. But for now, it's a global.
import './index.js';

import * as MainApplication from './app/main/MainApplication.js';
import * as ClientApplication from './app/client/ClientApplication.js';

/** The root project directory */
const DIRECTORY = '.';

/**
 * The entry point to the program.
 */
export async function main(args)
{
    await ClientApplication.onStart(args);
    
    let config;
    let db;
    try
    {
        /**
         * Loading - Where all data should be loaded from file. This
         * should be raw data as defined by the user. No modifications
         * should take place; they will be considered for alterations
         * in the processing stage.
         */

        // Starting setup...
        config = await MainApplication.resolveConfig(DIRECTORY);
        db = await MainApplication.resolveDatabase(config);

        await ClientApplication.onSetup(db, config);

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
        await ClientApplication.onPreProcess(db, config);

        // All setup is GUARANTEED to be done now. Reviews are now to be processed...
        // Any errors that dare to surface will be vanquished here. Or ignored...
        await MainApplication.validateDatabase(db, config);

        await ClientApplication.onPostProcess(db, config);
    
        /**
         * Outputting - Where all data is outputted into relevant
         * files. If any errors had occured, it will exit-early and
         * output any gathered debug information.
         */

        // All validation is GUARANTEED to be done now. Outputs can now be generated...
        await MainApplication.generateOutput(db, config);

        await ClientApplication.onOutput(db, config);
    }
    catch(e)
    {
        await ClientApplication.onError(db, config, e);

        console.error('Program failed.', e);
        return false;
    }

    await ClientApplication.onStop(db, config);

    return true;
}
