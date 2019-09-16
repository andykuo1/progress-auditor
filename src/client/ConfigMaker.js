import { log, debug, askPrompt, ask, askPath, askDate } from './Client.js';
import { createResolver, ifFailOrAgain } from './helper/Resolver.js';

export async function run(cache = {})
{
    cache.newConfig = {};

    let result = null;

    debug("Starting Config Maker...");
    log("Welcome to Config Maker!");

    result = await createResolver()
        .init("Want to create a new config?")
        .run(async () =>
        {
            cache.newConfig = {};

            log("...building config (0/6)...");
            const inputPath = await askPath("Input Path", false, true);
            cache.newConfig.inputPath = inputPath;

            log("...building config (1/6)...");
            const outputPath = await askPath("Output Path", true, true);
            cache.newConfig.outputPath = outputPath;

            log("...building config (2/6)...");
            const scheme = await askPrompt("Scheme", 'select', {
                choices: [ 'piazza' ]
            });

            log("...building config (3/6)...");
            const assignments = await createResolver()
                .init("Want to add assignments?")
                .run(async () =>
                {
                    log("What are the names of the assignments? These are used to uniquely identify each assignment \"class\".");
                    const assignmentList = await askPrompt("Assignments (comma-separated)", 'list');

                    const result = [];
                    for(const assignmentName of assignmentList)
                    {
                        const pattern = await askPrompt(
                            `What is the assignment schedule pattern for '${assignmentName}'?`,
                            'select',
                            {
                                choices: [ 'intro', 'sunday', 'last', '(custom)' ],
                            }
                        );

                        let opts = {};
                        if (pattern === '(custom)')
                        {
                            const customPath = await askPath("Where is the custom script file?",
                                true,
                                false,
                                value => value.endsWith('.js'));
                            opts.customPath = customPath;
                        }

                        result.push({
                            assignmentName,
                            pattern,
                            opts,
                        });
                    }

                    return result;
                })
                .again(ifFailOrAgain("Is this correct?", false))
                .resolve();

            log("...building config (4/6)...");
            const inputs = await createResolver()
                .init("Want to add inputs?")
                .run(async () =>
                {
                    log("What are the names of the inputs? These are used to uniquely identify each input type.");
                    const inputList = await askPrompt("Inputs (comma-separated)", 'list');

                    const result = [];
                    for(const inputName of inputList)
                    {
                        const parser = await askPrompt(
                            `What is the input parser for '${inputName}'?`,
                            'select',
                            {
                                choices: [ 'cohort', 'contributions', 'reviews', '(custom)' ],
                            }
                        );

                        let opts = {};
                        if (parser === '(custom)')
                        {
                            const customPath = await askPath("Where is the custom script file?",
                                true,
                                false,
                                value => value.endsWith('.js'));
                            opts.customPath = customPath;
                        }

                        result.push({
                            inputName,
                            parser,
                            opts,
                        });
                    }
                    
                    return result;
                })
                .again(ifFailOrAgain("Try Again?", false))
                .resolve();

            log("...building config (5/6)...");
            const outputs = await createResolver()
                .init("Want to add outputs?")
                .run(async () =>
                {
                    log("What are the names of the outputs? These are used to uniquely identify each output type.");
                    const outputList = await askPrompt("Outputs (comma-separated)", 'list');

                    const result = [];
                    for(const outputName of outputList)
                    {
                        const format = await askPrompt(
                            `What is the output format for '${outputName}'?`,
                            'select',
                            {
                                choices: [ 'instructor', 'student', '(custom)' ],
                            }
                        );

                        let opts = {};
                        if (format === '(custom)')
                        {
                            const customPath = await askPath("Where is the custom script file?",
                                true,
                                false,
                                value => value.endsWith('.js'));
                            opts.customPath = customPath;
                        }

                        result.push({
                            outputName,
                            format,
                            opts,
                        });
                    }
                    
                    return result;
                })
                .again(ifFailOrAgain("Is this correct?", false))
                .resolve();
            
            log("...building config (6/6)...");
            const outputAutoDate = await ask('Will you want to create date-organized outputs?');
            const include = await ask('Any other configs you want to include? (does nothing right now)');
            const currentDate = await askDate('What is the date for the current setup?');

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
        .again(ifFailOrAgain("Is this correct?", false))
        .resolve();
    
    if (result)
    {
        // Whether to save the config somewhere...
        if (await Client.ask("Do you want to save the config to file?"))
        {
            log("...Saving config file...");
            // TODO: FileUtil.writeToFile(path.resolve(directory, ConfigLoader.DEFAULT_CONFIG_FILE_NAME), JSON.stringify(result, null, 4));
        }

        log("Nice options! Hope to see you around!");
    }

    debug("Stopping Config Maker...");

    return result;
}