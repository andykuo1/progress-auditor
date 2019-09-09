import * as Menu from './menu/Menu.js';
import * as DateUtil from '../../util/DateUtil.js';

const path = require('path');

export async function onStart(args)
{
    Menu.printTitle();
    Menu.println();

    Menu.println("Running from directory:", path.resolve('.'));
    Menu.println();
}

export async function onSetup(db, config)
{
    /**
     * Loading - Where all data should be loaded from file. This
     * should be raw data as defined by the user. No modifications
     * should take place; they will be considered for alterations
     * in the processing stage.
     */

    Menu.println("Date:", DateUtil.stringify(db.currentDate));
    Menu.println();
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
    Menu.printlnError(error, config.debug || false);
}

export async function onStop(db, config)
{

}
