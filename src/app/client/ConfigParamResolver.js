import * as Client from '../../client/Client.js';
import * as Resolver from '../../client/helper/Resolver.js';

import * as ReviewHandler from '../main/ReviewHandler.js';

import * as ParserLoader from '../../input/parser/ParserLoader.js';
import * as AssignmentLoader from '../../input/assignment/AssignmentLoader.js';
import * as OutputLoader from '../../output/OutputLoader.js';

export async function resolveInputs(directory)
{
    const inputs = [];
    await Resolver.createResolver()
        .init("Want to add inputs?")
        .run(async () =>
        {
            const inputFilePath = await Client.askFindFile("Choose an input file:",
                directory,
                value =>
                {
                    if (!value.startsWith(directory)) return "Must be under specified input path directory.";
                    return true;
                });
            const parser = await Client.askChoose("Which parser should we use?",
                [...ParserLoader.getParserTypes(), '(custom)']);
            
            const opts = {};
            if (parser === '(custom)')
            {
                const customPath = await Client.askFindFile("Where is the custom script file?",
                    directory,
                    value =>
                    {
                        if (!value.endsWith('.js')) return "Must be a valid JavaScript file.";
                        if (!value.startsWith(directory)) return "Must be under specified input path directory.";
                        return true;
                    });
                opts.customPath = customPath;
            }
        
            const inputEntry = {
                inputName: inputFilePath.substring(directory.length + 1),
                parser,
                opts,
            };

            inputs.push(inputEntry);
            return inputEntry;
        })
        .again(async result =>
        {
            if (result) return await Client.ask("Do you want to add another input?");
            return await Client.ask("Do you want to try again?");
        })
        .resolve();
    
    return inputs;
}

export async function resolveOutputs(directory)
{
    const outputs = await Client.askPrompt("Which outputs do you want to generate?", 'select', {
        multiple: true,
        choices: OutputLoader.getOutputTypes(),
        // TODO: This is missing custom file.
    });

    return outputs.map(value => ({
        outputName: value,
        format: value,
        opts: {}
    }));
}

export async function resolveAssignments(directory)
{
    const assignments = [];
    if (await Client.ask("Want to use the default assignments? (intro, week, last)"))
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
        await Resolver.createResolver()
            .init("Want to add assignments?")
            .run(async () =>
            {
                Client.log("What are the names of the assignments? These are used to uniquely identify each assignment \"class\".");
                const assignmentList = await Client.askPrompt("Assignments (comma-separated)", 'list');

                const result = [];
                for(const assignmentName of assignmentList)
                {
                    const pattern = await Client.askChoose(`What is the assignment schedule pattern for '${assignmentName}'?`,
                        [...AssignmentLoader.getAssignmentTypes(), '(custom)']);

                    let opts = {};
                    if (pattern === '(custom)')
                    {
                        const customPath = await Client.askFindFile("Where is the custom script file?",
                            absInputPath,
                            value =>
                            {
                                if (!value.endsWith('.js')) return "Must be a valid JavaScript file.";
                                if (!value.startsWith(absInputPath)) return "Must be under specified input path directory.";
                                return true;
                            });

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
            .again(Resolver.ifFailAndAgain("Do you want to try again?"))
            .resolve();
    }
    return assignments;
}

export async function resolveInputPath(directory)
{
    const path = require('path');
    const inputPath = await Client.askPath("Specify a new input path", directory, true, true);
    return path.resolve(directory, inputPath);
}

export async function resolveOutputPath(directory)
{
    const path = require('path');
    const outputPath = await Client.askPath("Specify a new output path", directory, false, true);
    return path.resolve(directory, outputPath);
}

export async function resolveDate()
{
    return await Client.askDate('What is the date for the current run?', new Date(Date.now()));
}

export async function resolveScheme()
{
    return await Client.askChoose('What is the scheme you are using?', ReviewHandler.getSchemeNames());
}