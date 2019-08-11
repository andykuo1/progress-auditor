const Exports = require('./bundle.js');

main();

async function main()
{
    await Exports.run('./dist/config.json');
}