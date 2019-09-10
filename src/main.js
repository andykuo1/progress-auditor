// TODO: This should be it's own bundled file for plugins to use. But for now, it's a global.
import './index.js';

import * as MainApplication from './app/main/MainApplication.js';
import * as ClientApplication from './app/client/ClientApplication.js';

const path = require('path');

/**
 * The entry point to the program.
 */
export async function main(args)
{
    // The root project directory
    const DIRECTORY = args.length >= 2 ? path.resolve(args[2]) : path.resolve(process.execPath, '..');

    await ClientApplication.onStart(DIRECTORY, args);
    
    let config;
    let db;
    try
    {
        // Starting setup...
        config = await MainApplication.resolveConfig(DIRECTORY);
        db = await MainApplication.resolveDatabase(config);

        await ClientApplication.onSetup(db, config);
        await ClientApplication.onPreProcess(db, config);

        // All setup is GUARANTEED to be done now. Reviews are now to be processed...
        // Any errors that dare to surface will be vanquished here. Or ignored...
        await MainApplication.validateDatabase(db, config);
        await ClientApplication.onPostProcess(db, config);
    
        // All validation is GUARANTEED to be done now. Outputs can now be generated...
        await MainApplication.generateOutput(db, config);
        await ClientApplication.onOutput(db, config);
    }
    catch(e)
    {
        await ClientApplication.onError(db, config, e);
        return false;
    }

    await ClientApplication.onStop(db, config);
    return true;
}
