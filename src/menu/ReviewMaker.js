import * as Menu from './Menu.js';
import * as ReviewRegistry from '../stages/ReviewRegistry.js';
import * as MathHelper from '../util/MathHelper.js';

const inquirer = require('inquirer');
const chalk = require('chalk');

/**
 * This will run the steps to make a review and save it to file.
 */
export async function run(db, config, skipFirstCheck = true)
{
    console.log(chalk.gray("Starting Review Maker..."));
    console.log("Welcome to Review Maker");

    let result = null;
    
    while(!result)
    {
        let answer;
        if (!skipFirstCheck)
        {
            answer = await inquirer.prompt([
                {
                    message: "Would you like to make a new review?",
                    name: "value",
                    type: "confirm",
                }
            ]);
        }
        else
        {
            skipFirstCheck = false;
            answer = { value: true };
        }

        if (!answer.value) break;

        result = await makeReview(db, config);

        if (result)
        {
            const ID = 0;
            const DATE = 1;
            const COMMENT = 2;
            const TYPE = 3;
            const PARAMS = 4;

            const reviewer = ReviewRegistry.getReviewerByType(result[TYPE]);
            const paramTypes = reviewer.REVIEW_PARAM_TYPES;
            const desc = reviewer.REVIEW_DESC;
    
            console.log(chalk.cyan('>'), 'Review', chalk.green(`${result[TYPE]} ( ${paramTypes.join(', ')} )`, chalk.gray(`- ${desc}`)));
            console.log(chalk.cyan('>'), 'Comment', chalk.cyan(`${result[COMMENT]}`));
            console.log(chalk.cyan('>'), 'Date', chalk.cyan(`${result[DATE]}`));
            console.log(chalk.cyan('>'), 'ID', chalk.cyan(`${result[ID]}`));
            console.log(chalk.cyan('>'), 'Parameters');
            for(let i = 0; i < result[PARAMS].length; ++i)
            {
                console.log(chalk.cyan('>'), `- ${paramTypes[i]} = '${chalk.cyan(result[PARAMS][i])}'`);
            }

            answer = await inquirer.prompt([
                {
                    message: 'Is this correct?',
                    name: 'value',
                    type: 'confirm'
                }
            ]);
            if (!answer.value) result = null;
        }
        else
        {
            console.log(chalk.red('...trying again...'));
        }
    }

    if (result)
    {
        console.log("Good review! Hope to see you soon!");
    }
    
    console.log(chalk.gray("...Stopping Review Maker"));

    return result;
}

async function makeReview(db, config)
{
    let id = MathHelper.stringHash(MathHelper.uuid());
    let date = new Date(Date.now());
    let comment = '';
    let type;
    let params;

    // Resolve type...
    type = await chooseReviewType(db, config);
    if (!type) return null;

    // Resolve params...
    params = await chooseReviewParameters(db, config, type);
    if (!params) return null;

    // (Optionally) Resolve comment...
    if ((await inquirer.prompt([
        {
            message: 'Do you want to add a comment?',
            name: 'value',
            type: 'confirm'
        }
    ])).value)
    {
        comment = (await inquirer.prompt([
            {
                message: 'What is the comment? (By default, it is blank.)',
                name: 'value',
                type: 'input',
            }
        ])).value;
    }

    // (Optionally) Resolve id...
    // TODO: Not yet implemented.

    return [id, date, comment, type, params];
}

async function chooseReviewType(db, config)
{
    const reviewers = ReviewRegistry.getReviewers();
    let answer;

    answer = await inquirer.prompt([
        {
            message: "What type of review do you want to make?",
            name: "value",
            type: "list",
            choices: (session) => {
                const result = [];
                for(const reviewer of reviewers)
                {
                    result.push({
                        name: `${reviewer.REVIEW_TYPE} - ${reviewer.REVIEW_DESC}`,
                        value: reviewer.REVIEW_TYPE,
                        short: reviewer.REVIEW_TYPE
                    });
                }
                result.push(
                    {
                        name: "...or a custom type?",
                        value: "__custom",
                        short: "(custom type)"
                    }
                );
                result.push(
                    {
                        name: "...or go back?",
                        value: "__cancel",
                        short: "(go back)"
                    }
                );
                return result;
            }
        }
    ]);

    if (answer.value === '__custom')
    {
        answer = await inquirer.prompt([
            {
                message: "What is the custom review type?",
                name: "value",
                type: "input",
                validate: (input) => {
                    if (input.length === 0) return "Cannot be empty.";
                    if (input.trim().length < input.length) return "Cannot have leading or trailing whitespace.";
                    if (/^\S*$/.test(input)) return "Cannot have whitespaces.";
                    if (reviewTypes.has(input)) return "Review type already exists.";
                    return true;
                }
            }
        ]);
    }
    else if (answer.value === '__cancel')
    {
        return null;
    }

    return await confirmLoop(answer.value, async (reviewType) => {
        const reviewer = ReviewRegistry.getReviewerByType(reviewType);
        const paramTypes = reviewer.REVIEW_PARAM_TYPES;
        const desc = reviewer.REVIEW_DESC;

        console.log(chalk.cyan('>'), chalk.green(`${reviewType} ( ${paramTypes.join(', ')} )`, chalk.gray(`- ${desc}`)));
        const answer = await inquirer.prompt([
            {
                name: 'value',
                message: `Is this correct?`,
                type: 'confirm'
            }
        ]);

        return answer.value;
    }, async () => await chooseReviewType(db, config));
}

async function chooseReviewParameter(db, config, paramType)
{
    let answer;

    answer = await inquirer.prompt([
        {
            message: `What is the value for '${paramType}'?`,
            name: 'value',
            type: 'input',
        }
    ]);

    return answer.value;
}

async function chooseReviewParameters(db, config, reviewType)
{
    const result = [];
    const reviewer = ReviewRegistry.getReviewerByType(reviewType);
    const paramTypes = reviewer.REVIEW_PARAM_TYPES;
    for(const paramType of paramTypes)
    {
        const paramValue = await chooseReviewParameter(db, config, paramType);
        if (paramValue !== null)
        {
            result.push(paramValue);
        }
        else
        {
            break;
        }
    }

    return result;
}

async function confirmLoop(value, confirmCallback, loopCallback)
{
    const result = await confirmCallback(value);
    if (result)
    {
        return value;
    }
    else
    {
        return await loopCallback();
    }
}