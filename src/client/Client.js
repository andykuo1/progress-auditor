/**
 * This file handles all client interface formatting. Any
 * interactions from the client should be handled through
 * here instead of directly working with the cli.
 * 
 * @module Client
 */

import Enquirer from 'enquirer';
import * as DateUtil from '../util/DateUtil.js';
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

export async function prompt(question)
{
    return await Enquirer.prompt(question);
}

export async function askPrompt(message, type, opts = {})
{
    const { answer } = await Enquirer.prompt({
        type,
        message,
        name: 'answer',
        ...opts
    });
    return answer;
}

export async function ask(message, defaultValue = false)
{
    const { answer } =  await Enquirer.prompt({
        type: 'confirm',
        name: 'answer',
        message,
        initial: Boolean(defaultValue),
    });
    return answer;
}

export async function askChoose(message, choices, autocomplete = true)
{
    const { answer } =  await Enquirer.prompt({
        type: autocomplete ? 'autocomplete' : 'select',
        name: 'answer',
        limit: 10,
        message,
        choices,
    });
    return answer;
}

export async function askPath(message, baseDirectory, exists = true, isDirectory = false, validate = undefined)
{
    const fs = require('fs');
    const path = require('path');
    return await askPrompt(message, 'input', {
        result: value => path.resolve(baseDirectory, value),
        validate: value =>
        {
            const absPath = path.resolve(baseDirectory, value);
            if (validate) validate.call(null, absPath);
            if (!exists) return true;
            if (!fs.existsSync(absPath))
            {
                return "Path does not exist.";
            }
            else
            {
                const stat = fs.lstatSync(absPath);
                if (isDirectory && !stat.isDirectory())
                {
                    return "Path is not a directory.";
                }
                else if (!isDirectory && !stat.isFile())
                {
                    return "Path is not a file.";
                }
            }
            return true;
        }
    });
}

export async function askFindFile(message, directory = '.', validate = undefined)
{
    const DIRECTORY_SYMBOL = '\u2192';
    const fs = require('fs');
    const path = require('path');
    directory = path.resolve(directory);

    let result = null;
    do
    {
        const files = fs.readdirSync(directory, { withFileTypes: true });

        const choices = [];
        choices.push({
            message: `${DIRECTORY_SYMBOL} .`,
            value: { directory: true, name: '.' },
        });
        choices.push({
            message: `${DIRECTORY_SYMBOL} ..`,
            value: { directory: true, name: '..' },
        });
        for(const dirent of files)
        {
            if (dirent.isDirectory())
            {
                choices.push({
                    message: `${DIRECTORY_SYMBOL} ${dirent.name}/`,
                    value: { directory: true, name: dirent.name },
                });
            }
            else
            {
                choices.push({
                    message: `  ${dirent.name}`,
                    value: { directory: false, name: dirent.name },
                });
            }
        }

        const prompt = new Enquirer.AutoComplete({
            type: 'autocomplete',
            name: 'file',
            message,
            limit: 10,
            choices,
            format: value => {
                if (typeof value === 'string')
                {
                    return directory + '/' + value;
                }
                else
                {
                    return directory + '/' + value.name;
                }
            },
            suggest: (input, choices) =>
            {
                let str = input.toLowerCase();
                const result = choices.filter(ch => ch.message.toLowerCase().includes(str));

                // Add the custom path as a selectable option...
                result.push({ message: input });

                return result;
            },
            validate: value =>
            {
                if (typeof value === 'string')
                {
                    if (!fs.existsSync(path.resolve(directory, value)))
                    {
                        return "File does not exist.";
                    }
                    else
                    {
                        return true;
                    }
                }
                else
                {
                    // It's already been checked to have existed.
                    return true;
                }
            }
        });

        let fileEntry = await prompt.run();
        if (!fileEntry) return null;

        let filePath;

        // Client used the custom path instead...
        if (typeof fileEntry === 'string')
        {
            filePath = path.resolve(directory, fileEntry);
            
            // filePath is guaranteed to exist due to validate()...
            fileEntry = {
                directory: fs.lstatSync(filePath).isDirectory(),
                name: fileEntry,
            };
        }
        // Client picked one from the list...
        else
        {
            filePath = path.resolve(directory, fileEntry.name);
        }

        if (fileEntry.directory)
        {
            directory = filePath;
        }
        else if (!validate || validate.call(null, filePath))
        {
            result = filePath;
            break;
        }
        else
        {
            result = null;
        }

        // Clear it for the next directory...
        prompt.clear();
    }
    while(!result)

    return result;
}

export async function askDate(message, defaultValue = undefined)
{
    const result = await askPrompt(message, 'input', {
        initial: defaultValue && DateUtil.stringify(defaultValue, false),
        hint: "YYYY-MM-DD-hh:mm:ss (You don't need the time)",
        validate: value =>
        {
            try
            {
                DateUtil.parse(value);
            }
            catch(e)
            {
                return e.message;
            }
            return true;
        }
    });

    return DateUtil.parse(result);
}
