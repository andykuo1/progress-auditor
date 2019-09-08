import { clearDatabase } from '../database/DatabaseSetup.js';
import * as ReviewDatabase from '../database/ReviewDatabase.js';
import * as Menu from './Menu.js';
import * as ReviewMaker from './ReviewMaker.js';

const inquirer = require('inquirer');
const chalk = require('chalk');

async function chooseError(errors)
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

export async function run(db, config, processCallback)
{
    let dst = [];
    let errors = db.getErrors();
    while (errors.length > 0)
    {
        Menu.printlnError(`Found ${errors.length} errors. :(`);
        if (await Menu.askYesNo("Do you want to review them now?"))
        {
            // Review each error...
            const errorID = await chooseError(errors);
            const error = db.getErrorByID(errorID);
            const errorMessage = `${chalk.gray(error.id + ':')} ${error.message}`;
            Menu.printError(errorMessage);
            const errorSolutions = `${chalk.green(`${chalk.bold(`= Solutions: ${'='.repeat(67)}`)}\n => ${error.options.join('\n => ')}\n${chalk.bold('='.repeat(80))}`)}`;
            Menu.println(errorSolutions);

            const answer = await Menu.askChoose(
                "Continue to review?",
                ["Yes, review it now.", 'yes'],
                ["Yes, but with more info.", 'more'],
                ["No, go back.", 'no']
            );

            switch(answer)
            {
                case 'more':
                    const errorInfo = `${chalk.yellow(`${chalk.bold(`= More Info: ${'='.repeat(67)}`)}\n | ${error.more.join('\n')}\n${'='.repeat(80)}`)}`;
                    Menu.println(errorInfo);
                case 'yes':
                    // Let it pass.
                    break;
                case 'no':
                default:
                    // Go back to the start of the loop.
                    continue;
            }

            const review = await ReviewMaker.run(db, config, true);
            if (review) dst.push(review);

            // Restart the database...
            await clearDatabase(db, config);

            // Add the new reviews to the database...
            for(const review of dst)
            {
                ReviewDatabase.addReview(db, ...review);
            }

            // Re-run the process again for new errors...
            await processCallback(db, config);

            // Get new errors...
            errors = db.getErrors();
        }
        else
        {
            Menu.println(`Skipping errors...${Math.random() > 0.6 ? chalk.gray(`...(I trust you)...`) : ''}`);
            errors.length = 0;
            break;
        }
    }

    if (errors.length <= 0)
    {
        Menu.println("Hooray! No errors!");
    }

    return dst;
}