/*
// Testing...
import './util/DateTest.js';
export async function main() {};
*/

import { main } from './main.js';

main(process.argv).then(result => {
    if (result)
    {
        console.log("Success!");
    }
    else
    {
        console.log("Failure!");
    }
});

/**
 * This program will generate reports based on the supplied database
 * of users, submissions, reviews and other logistical information.
 * The first argument is the root config file. This JSON file specifies
 * all the options necessary to process the data. Refer to the README
 * for more specifics.
 * 
 * If no argument is specified, it will enter into interactive mode.
 */