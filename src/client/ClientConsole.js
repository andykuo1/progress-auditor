import * as MathHelper from '../util/MathHelper.js';
import * as ProgressOtter from './helper/ProgressOtter.js';
import chalk from 'chalk';
import figlet from 'figlet';

export const DIVIDER_LENGTH = 80;
export const CHOICE_SEPARATOR = { message: "\n=-=-= END " + "=-".repeat(35) + "\n", role: 'separator' };
const SHOW_STACK_TRACE = true;

export function log(message)
{
    console.log(message);
}

export function debug(message)
{
    console.log(chalk.gray(message));
}

export function error(message, expected = false)
{
    console.error(chalk.redBright(message));
    
    if (!expected && SHOW_STACK_TRACE)
    {
        console.trace(chalk.red(message));
    }
}

export function success(message)
{
    console.log(chalk.green(message));
}

export function motivation()
{
    ProgressOtter.say(ProgressOtter.getMotivation());
}

export function formattedError(errorMessage, depth = 0)
{
    if (Array.isArray(errorMessage))
    {
        for(const message of errorMessage)
        {
            if (message === '=>')
            {
                depth += 1;
            }
            else if (message === '<=')
            {
                depth -= 1;
            }
            else
            {
                formattedError(message, depth);
            }
        }
    }
    else
    {
        error('  '.repeat(depth) + ' ' + ((depth <= 0) ? '+' : '-') + ' ' + errorMessage);
    }
}

const MAX_SKIPPED_ERRORS = 100;
const SKIPPED_ERRORS = new Set();
const NO_SKIP_ERRORS = new Set();
const FORCE_SKIP_ERRORS = new Set();
export async function skippedError(message, reason = undefined)
{
    const errorMessage = message + " - " + (reason instanceof Error ? reason.message : reason);
    error(errorMessage, true);

    const errorHash = MathHelper.stringHash(errorMessage);
    if (FORCE_SKIP_ERRORS.has(errorHash))
    {
        debug("...Auto-skipping error...");
    }
    else if (!(await ask("...Skip the error?", true).catch(e => false)))
    {
        throw new Error("Failed error. Aborting...");
    }
    else if (SKIPPED_ERRORS.has(errorHash))
    {
        try
        {
            if (await ask("...Skip this error in the future?"))
            {
                FORCE_SKIP_ERRORS.add(errorHash);
            }
            else
            {
                NO_SKIP_ERRORS.add(errorHash);
            }
        }
        catch(e)
        {
            // Just ignore it.
        }
    }
    else
    {
        if (SKIPPED_ERRORS.size > MAX_SKIPPED_ERRORS)
        {
            SKIPPED_ERRORS.clear();
        }

        SKIPPED_ERRORS.add(errorHash);
    }
}

export async function wait(seconds, message = undefined)
{
    if (message) log(message);
    await new Promise(resolve => setTimeout(resolve, 1000 * seconds));
}

export function divider(token = 'nu')
{
    log(chalk.gray(
        token.repeat(Math.floor(DIVIDER_LENGTH / token.length))
        + token.substring(0, DIVIDER_LENGTH % token.length)
    ));
}

export function doTheBigTitleThing(title = 'Progress Auditor', subtitle = 'Version v?.?.?')
{
    divider();
    log(chalk.green(figlet.textSync(title, { font: 'Big' })));
    if (subtitle)
    {
        log(subtitle.padStart(DIVIDER_LENGTH, ' '));
    }
    divider();
}
