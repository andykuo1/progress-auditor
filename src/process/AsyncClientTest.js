async function main()
{
    const configProcess = new AsyncClientProcess()
        .when('run', async () =>
        {
            configProcess.log("Finding config in working directory...");
            configProcess.log("...none found...");

            if (await configProcess.askConfirm('Can you show me where to find a valid config?'))
            {
                const exploreProcess = new AsyncClientProcess()
                    .when('setup', async () =>
                    {
                    })
                    .when('run', async () =>
                    {
                        const { file } = await exploreProcess.prompt({ type: 'file-tree-selection', name: 'file' });
                        return {
                            filepath: file
                        };
                    });
                return await exploreProcess.run();
            }
            else if (await configProcess.askConfirm('Do you want to build a new one?'))
            {
                const buildProcess = new AsyncClientProcess()
                    .when('run', async () =>
                    {
                        buildProcess.log('Here we go.');
                        const answer = await buildProcess.askConfirm('Do you like cheese?');
                        if (answer)
                        {
                            return {
                                name: 'Cheesy',
                                version: '0.0.1',
                            };
                        }

                        return null;
                    })
                    .when('continue', async () =>
                    {
                        if (!buildProcess.result)
                        {
                            return await buildProcess.askConfirm('Do you want to try again?');
                        }
                        else
                        {
                            return false;
                        }
                    });
                return await buildProcess.run();
            }
            else if (await configProcess.askConfirm('Do you want to do anything!?'))
            {
                configProcess.log('Oh. Right. Move along.');
                return;
            }
            else if (await configProcess.askConfirm('Alright then. Do you want to quit?'))
            {
                configProcess.log('Cool. I\'ll catch you on the flip side.');
                return;
            }
            else if (await configProcess.askConfirm('No? What do you mean? There\'s really not much else to do.'))
            {
                configProcess.log('Thank goodness.');
                return;
            }
            else
            {
                configProcess.log('Happy? I hope so.');
                return;
            }
        })
        .when('continue', async () =>
        {
            if (!configProcess.result)
            {
                return await configProcess.askConfirm('Do you want to try the WHOLE THING again?');
            }
            else
            {
                return false;
            }
        });
    
    const config = await configProcess.run();

    console.log();
    console.log("Here is the final config:");
    console.log(JSON.stringify(config));
    console.log("Thank you! On to the next one!");
}

main();
