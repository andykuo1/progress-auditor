/** Run your tests here. */

// import './util/DateTest.js';

import * as ConfigResolver from './client/ConfigResolver.js';
import * as Client from './client/Client.js';

async function main()
{
    const filepath = await Client.askFindFile("Where is it?");
    console.log(filepath);

    /*
    const cache = {
        configResolver: {}
    };

    process.on('exit', () =>
    {
        console.error(JSON.stringify(cache));
    });
    
    const config = await ConfigResolver.run('./', cache.configResolver);
    console.log(config);
    console.log("To be used later...");
    */
}

main();

