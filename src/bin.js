import { run } from './main.js';

const path = require('path');
const configPath = path.resolve(path.dirname(process.execPath), process.argv[2] || './config.json');
run(configPath);

/**
 * This program will generate reports based on the supplied database
 * of users, submissions, reviews and other logistical information.
 * The first argument is the root config file. This JSON file specifies
 * all the options necessary to process the data. Refer to the README
 * for more specifics.
 * 
 * If no argument is specified, it will enter into interactive mode.
 */