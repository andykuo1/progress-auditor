const Main = require('./bundle.js');

main();

async function main()
{
    await Main.run('./dist/config.json');
}