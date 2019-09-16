/** Run your tests here. */

// import './util/DateTest.js';

import * as ReviewResolver from './client/ReviewResolver.js';

let id = 0;
function createError(message)
{
    return {
        id: ++id,
        message
    };
}

async function main()
{
    const cache = {};

    const result = await ReviewResolver.run([
        createError("Sad error"),
        createError("Happy error"),
        createError("Other error"),
    ], cache);
}

main();

