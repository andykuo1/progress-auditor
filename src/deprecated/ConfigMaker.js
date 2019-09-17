import { log, debug, askPrompt, ask, askPath, askDate, askFindFile, askChoose } from './Client.js';
import { createResolver, ifFailAndAgain } from './helper/Resolver.js';
import * as FileUtil from '../util/FileUtil.js';
import * as AssignmentLoader from '../input/assignment/AssignmentLoader.js';
import * as ParserLoader from '../input/parser/ParserLoader.js';
import * as ReviewHandler from '../app/main/ReviewHandler.js';
import * as ConfigLoader from '../config/ConfigLoader.js';
import * as OutputLoader from '../output/OutputLoader.js';
import path from 'path';

export async function run(directory)
{
    let result = null;

    debug("Starting Config Maker...");
    log("Welcome to Config Maker!");

    result = await createResolver()
        .run(async () =>
        {
            log("...building config (0/6)...");
            const inputPath = await askPath("Input Path", directory, true, true);
            if (!inputPath) return;
            const absInputPath = path.resolve(directory, inputPath);

            log("...building config (1/6)...");
            const outputPath = await askPath("Output Path", directory, false, true);
            if (!outputPath) return;
            const absOutputPath = path.resolve(directory, outputPath);

            log("...building config (2/6)...");
            const scheme = await askPrompt("Scheme", 'select', {
                choices: ReviewHandler.getSchemeNames()
            });
            if (!scheme) return;

            log("...building config (3/6)...");
            let assignments = [];

            // NOTE: this is specific to piazza.
            if (await ask("Want to use the default assignments? (intro, week, last)"))
            {
                assignments.push(
                    {
                        assignmentName: 'intro',
                        pattern: 'intro',
                        opts: {},
                    },
                    {
                        assignmentName: 'week',
                        pattern: 'sunday',
                        opts: {},
                    },
                    {
                        assignmentName: 'last',
                        pattern: 'last',
                        opts: {},
                    }
                );
            }
            // This is generic.
            else
            {
                await createResolver()
                    .init("Want to add assignments?")
                    .run(async () =>
                    {
                        log("What are the names of the assignments? These are used to uniquely identify each assignment \"class\".");
                        const assignmentList = await askPrompt("Assignments (comma-separated)", 'list');
                        if (!assignmentList) return;
    
                        const result = [];
                        for(const assignmentName of assignmentList)
                        {
                            const pattern = await askChoose(`What is the assignment schedule pattern for '${assignmentName}'?`,
                                [...AssignmentLoader.getAssignmentTypes(), '(custom)']);
                            if (!pattern) continue;
    
                            let opts = {};
                            if (pattern === '(custom)')
                            {
                                const customPath = await askFindFile("Where is the custom script file?",
                                    absInputPath,
                                    value =>
                                    {
                                        if (!value.endsWith('.js')) return "Must be a valid JavaScript file.";
                                        if (!value.startsWith(absInputPath)) return "Must be under specified input path directory.";
                                        return true;
                                    });
                                if (!customPath) continue;
    
                                opts.customPath = customPath;
                            }
    
                            result.push({
                                assignmentName,
                                pattern,
                                opts,
                            });
                        }
    
                        assignments.push(...result);
                        return result;
                    })
                    .again(ifFailAndAgain("Do you want to try again?"))
                    .resolve();
            }

            log("...building config (4/6)...");
            let inputs = [];
            await createResolver()
                .init("Want to add inputs?")
                .run(async () =>
                {
                    const inputFilePath = await askFindFile("Choose an input file:",
                        absInputPath,
                        value =>
                        {
                            if (!value.startsWith(absInputPath)) return "Must be under specified input path directory.";
                            return true;
                        });
                    const parser = await askChoose("Which parser should we use?",
                        [...ParserLoader.getParserTypes(), '(custom)']);
                    
                    const opts = {};
                    if (parser === '(custom)')
                    {
                        const customPath = await askFindFile("Where is the custom script file?",
                            absInputPath,
                            value =>
                            {
                                if (!value.endsWith('.js')) return "Must be a valid JavaScript file.";
                                if (!value.startsWith(absInputPath)) return "Must be under specified input path directory.";
                                return true;
                            });
                        opts.customPath = customPath;
                    }
                
                    const inputEntry = {
                        inputName: inputFilePath.substring(absInputPath.length + 1),
                        parser,
                        opts,
                    };

                    inputs.push(inputEntry);
                    return inputEntry;
                })
                .again(async result =>
                {
                    if (result) return await ask("Do you want to add another input?");
                    return await ask("Do you want to try again?");
                })
                .resolve();
            
            log("...building config (5/6)...");
            const outputs = [];

            await askPrompt("Which outputs do you want to generate?", 'select', {
                multiple: true,
                choices: OutputLoader.getOutputTypes(), // TODO: This is missing custom file.
            });
            
            log("...building config (6/6)...");
            const outputAutoDate = await ask('Will you want to create date-organized outputs?');
            const include = []; // TODO: Not asking for includes?
            const currentDate = await askDate('What is the date for the current setup?', new Date(Date.now()));

            return {
                currentDate,
                include,
                inputPath,
                outputPath,
                outputAutoDate,
                scheme,
                assignments,
                inputs,
                outputs,
            };
        })
        .again(ifFailAndAgain("Do you want to try another config?"))
        .resolve();
    
    if (result)
    {
        // Whether to save the config somewhere...
        if (await ask("Do you want to save the config to file?"))
        {
            const configPath = path.resolve(directory, ConfigLoader.DEFAULT_CONFIG_FILE_NAME);
            log(`...Saving config file to '${configPath}'...`);
            await FileUtil.writeToFile(configPath, JSON.stringify(result, null, 4));
        }

        log("Nice options! Hope to see you around!");
    }

    debug("Stopping Config Maker...");

    return result;
}