import * as Menu from './Menu.js';
import * as ReviewRegistry from '../../../input/review/ReviewRegistry.js';
import * as MathHelper from '../../../util/MathHelper.js';
import * as DateUtil from '../../../util/DateUtil.js';
import * as FileUtil from '../../../util/FileUtil.js';
import * as ConfigLoader from '../../../config/ConfigLoader.js';

import * as SchemeHandler from '../../main/SchemeHandler.js';

const inquirer = require('inquirer');
const chalk = require('chalk');

/*
{
    "currentDate": "2019-7-30",
    "include": [],
    "scheme": "piazza",
    "inputPath": "./__TEST__/in",
    "outputPath": "./__TEST__/out",
    "outputAutoDate": true,
    "debug": true,
    "assignments": [
        {
            "assignmentName": "intro",
            "pattern": "intro",
            "opts": {}
        },
        {
            "assignmentName": "week",
            "pattern": "sunday",
            "opts": {}
        },
        {
            "assignmentName": "last",
            "pattern": "last",
            "opts": {}
        }
    ],
    "inputs": [
        {
            "inputName": "reviews.csv",
            "parser": "reviews",
            "opts": {}
        },
        {
            "inputName": "vacations.csv",
            "parser": "vacations",
            "opts": {}
        },
        {
            "inputName": "contributions.csv",
            "parser": "contributions",
            "opts": {}
        },
        {
            "inputName": "cohort.csv",
            "parser": "cohort",
            "opts": {
                "maxEndDates": [
                    { "pattern": "Special Summer Session 2019", "endDate": "2019-9-6" }
                ]
            }
        }
    ],
    "outputs": [
        {
            "outputName": "slip-days.csv",
            "format": "instructor"
        },
        {
            "outputName": "reports.csv",
            "format": "student",
            "opts": {
                "exportPDF": "reports.pdf",
                "customIntro": "",
                "customOutro": ""
            }
        }
    ]
}
*/

/**
 * This will run the steps to make a config and save it to file.
 */
export async function run(directory, skipFirstCheck = true)
{
    console.log(chalk.gray("Starting Config Maker..."));
    console.log("Welcome to Config Maker");

    let result = null;

    while(!result)
    {
        if (skipFirstCheck)
        {
            skipFirstCheck = false;
        }
        else if (!await Menu.askYesNo('Would you like to make a new config?'))
        {
            break;
        }

        result = await makeConfig(directory);

        if (result)
        {
            console.log(chalk.cyan('>'), 'Config', chalk.green(JSON.stringify(result, null, 4)));

            if (!await Menu.askYesNo('Is this correct?'))
            {
                result = null;
            }
        }
        else
        {
            console.log(chalk.red('...trying again...'));
        }
    }

    if (result)
    {
        // Whether to save the config somewhere...
        if (await Menu.askYesNo("Do you want to save the config to file?"))
        {
            console.log("...Saving config file...");
            FileUtil.writeToFile(path.resolve(directory, ConfigLoader.DEFAULT_CONFIG_FILE_NAME), JSON.stringify(result, null, 4));
        }

        console.log("Nice options! Hope to see you around!");
    }
    
    console.log(chalk.gray("...Stopping Config Maker"));

    return result;
}

async function makeConfig(directory)
{
    // Required
    const inputPath = await chooseInputPath(directory);
    if (!inputPath) return null;
    const outputPath = await chooseOutputPath(directory);
    if (!outputPath) return null;
    const scheme = await chooseScheme();
    if (!scheme) return null;

    // Optional
    const currentDate = await chooseCurrentDate();
    if (!currentDate) return null;
    const outputAutoDate = await chooseOutputAutoDate();
    if (!outputAutoDate) return null;
    const debug = await chooseDebug();
    if (!debug) return null;

    // TODO: Find configs to include
    // Create Assignemnt Entry
    const assignments = [
        {
            "assignmentName": "intro",
            "pattern": "intro",
            "opts": {}
        },
        {
            "assignmentName": "week",
            "pattern": "sunday",
            "opts": {}
        },
        {
            "assignmentName": "last",
            "pattern": "last",
            "opts": {}
        }
    ];
    // Create Input Entry
    const inputs = [
        {
            "inputName": "reviews.csv",
            "parser": "reviews",
            "opts": {}
        },
        {
            "inputName": "vacations.csv",
            "parser": "vacations",
            "opts": {}
        },
        {
            "inputName": "contributions.csv",
            "parser": "contributions",
            "opts": {}
        },
        {
            "inputName": "cohort.csv",
            "parser": "cohort",
            "opts": {
                "maxEndDates": [
                    { "pattern": "Special Summer Session 2019", "endDate": "2019-9-6" }
                ]
            }
        }
    ];
    // Create Output Entry
    const outputs = [
        {
            "outputName": "slip-days.csv",
            "format": "instructor"
        },
        {
            "outputName": "reports.csv",
            "format": "student",
            "opts": {
                "exportPDF": "reports.pdf",
                "customIntro": "",
                "customOutro": ""
            }
        }
    ];

    return {
        currentDate,
        outputAutoDate,
        debug,
        inputPath,
        outputPath,
        scheme,
        assignments,
        inputs,
        outputs,
    };
}

async function chooseInputPath(directory)
{
    // TODO: this should be a file explorer...
    return (await inquirer.prompt([
        {
            message: 'Where is the input directory?',
            name: 'value',
            type: 'input',
            default: directory
        }
    ])).value;
}

async function chooseOutputPath(directory)
{
    // TODO: this should be a file explorer...
    return (await inquirer.prompt([
        {
            message: 'Where is the output directory?',
            name: 'value',
            type: 'input',
            default: directory
        }
    ])).value;
}

async function chooseScheme()
{
    return Menu.askChoose('Which scheme will you be using?', SchemeHandler.getSchemeNames());
}

async function chooseCurrentDate()
{
    return DateUtil.stringify(new Date(Date.now()));
}

async function chooseOutputAutoDate()
{
    return true;
}

async function chooseDebug()
{
    return false;
}

async function makeAssignmentEntry()
{

}

async function makeInputEntry()
{
    
}

async function makeOutputEntry()
{

}
