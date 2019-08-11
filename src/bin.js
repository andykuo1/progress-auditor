import { run } from './main.js';

const path = require('path');
const configPath = path.resolve(path.dirname(process.execPath), process.argv[2] || './config.json');
run(configPath);