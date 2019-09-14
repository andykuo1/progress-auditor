import * as Menu from '../client/menu/Menu.js';
import * as ReviewMaker from '../client/menu/ReviewMaker.js';

const chalk = require('chalk');
const inquirer = require('inquirer');

export async function askClientToPickError(errors)
{
    const dst = [];
    for(const error of errors)
    {
        dst.push({
            name: `${chalk.gray(error.id + ': ')} ${error.message}`,
            value: error.id,
            short: error.id + ': ' + error.message,
        });
    }
    dst.push(new inquirer.Separator("=-=- END -" + "=-".repeat(35)));

    const answer = await inquirer.prompt([
        {
            message: 'Which error do you want to review?',
            name: 'value',
            type: 'list',
            choices: dst,
            pageSize: 20
        }
    ]);
    return answer.value;
}

export async function showErrorInfo(error)
{
    const errorMessage = `${chalk.gray(error.id + ':')} ${error.message}`;
    Menu.printError(errorMessage);
    const errorSolutions = `${chalk.green(`${chalk.bold(`= Solutions: ${'='.repeat(67)}`)}\n => ${error.options.join('\n => ')}\n${chalk.bold('='.repeat(80))}`)}`;
    Menu.println(errorSolutions);

    if (await Menu.askYesNo("Show more info?"))
    {
        const errorInfo = `${chalk.yellow(`${chalk.bold(`= More Info: ${'='.repeat(67)}`)}\n | ${error.more.join('\n')}\n${'='.repeat(80)}`)}`;
        Menu.println(errorInfo);
    }
}

export async function askClientToReviewError(db, errorID)
{
    const error = db.getErrorByID(errorID);
    await showErrorInfo(error);
    return await Menu.askYesNo("Continue to review?");
}

export async function doReviewSession(db, config)
{
    return await ReviewMaker.run(db, config, true);
}