import chalk from 'chalk';
import { version } from '../../../../package.json';
import * as Client from '../../../client/Client.js';

import * as ProgressOtter from './ProgressOtter.js';

export const TITLE = "Progress Auditor";
export const DIVIDER_LENGTH = TITLE.length * 5;
const SHOW_STACK_TRACE = true;

export function println(...messages)
{
    console.log(printToString(...messages));
}

export function printToString(...messages)
{
    return messages.join(' ');
}

export function printDivider(token = 'nu')
{
    println(chalk.gray(
        token.repeat(Math.floor(DIVIDER_LENGTH / token.length))
        + token.substring(0, DIVIDER_LENGTH % token.length)
    ));
}

export function rightAlignString(...messages)
{
    const output = printToString(...messages);
    return output.padStart(DIVIDER_LENGTH, ' ');
}

export function printTitle()
{
    Client.doTheBigTitleThing(TITLE, 'Version ' + version);
}

export function printlnError(errorMessage, stackTrace = (SHOW_STACK_TRACE && errorMessage instanceof Error))
{
    printError(errorMessage);
    println();
    
    if (stackTrace)
    {
        console.trace(errorMessage);
    }
}

export function printError(errorMessage, depth = 0)
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
                printError(message, depth);
            }
        }
    }
    else
    {
        println('  '.repeat(depth), chalk.red(((depth <= 0) ? '+' : '-') + ' ' + errorMessage));
    }
}

export function evalArgs(argv)
{
    const dst = new Map();

    // No args.
    if (argv.length <= 2) return dst;

    let currentArg = null;
    for(let i = 2; i < argv.length; ++i)
    {
        const arg = argv[i];
        if (arg.startsWith('--'))
        {
            // A proper argument
            const name = arg.substring('--'.length);
            dst.set(name, []);
            currentArg = name;
        }
        else if (arg.startsWith('-'))
        {
            // An alias argument
            const name = arg.substring('-'.length);
            dst.set(name, []);
            currentArg = name;
        }
        else if (currentArg)
        {
            // A parameter for the argument
            dst.get(currentArg).push(arg);
        }
        else
        {
            // Found a parameter with no 
        }
    }
}

export function printMotivation()
{
    ProgressOtter.say(ProgressOtter.getMotivation());
}
