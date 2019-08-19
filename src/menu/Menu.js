import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';
import { version } from '../../package.json';

export const TITLE = "Progress Auditor";
export const DIVIDER_END_PADDING = 1;
export const DIVIDER_LENGTH = TITLE.length * 5 + DIVIDER_END_PADDING;

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
    return output.padStart(DIVIDER_LENGTH - DIVIDER_END_PADDING, ' ');
}

export function printTitle()
{
    const STYLED_TEXT = chalk.green(
        figlet.textSync(TITLE, {
            font: "Big"
        })
    );
    printDivider();
    println(STYLED_TEXT);
    println(rightAlignString('Version', version));
    printDivider();
}

export function printlnError(errorMessage)
{
    printError(errorMessage, 0);
    println();
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

export async function askYesNo(message)
{
    const {ask} = await inquirer.prompt([{
        name: 'ask',
        type: 'confirm',
        message
    }]);
    return ask;
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

const MOTIVATIONS = [
    "I believe in you.",
    "You are almost there.",
    "Have a hug. <3",
    "Clam's are good.",
    "Hooray! You've made progress!",
    "Yippee! You've made progress!",
    "A lot of progress, you've made.",
    "Don't worry. I got your back.",
    "You are doing good. Keep it up!",
    "You can do this.",
    "Sometimes, I just want to eat clams.",
    "Uh oh. That doesn't look good.",
    "Are you okay?",
    "Have you seen any clams around here?",
    "Found any clams lately?",
    "I like clams.",
    "I got 2 words: Giant. Clams.",
    "I hope this is helpful.",
    "It's better to get an error than to get nothing.",
    "I wonder if clams dream about me.",
    "Clams?",
    "Take a break. You deserve it.",
    "Come back in a few minutes. I know you can do it.",
    "That was unexpected.",
    "That's weird.",
    "Where did that come from?"
];

export function printMotivation()
{
    const motivation = MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
    console.log(chalk.green(`
     .-"""-.
    /      o\\     ${motivation}
   |    o   0).-.
   |       .-;(_/     .-.
    \\     /  /)).---._|  \`\\   ,
     '.  '  /((       \`'-./ _/|
       \\  .'  )        .-.;\`  /
        '.             |  \`\\-'
          '._        -'    /
    jgs      \`\`""--\`------\`
`));
}
