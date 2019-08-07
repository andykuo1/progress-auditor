const Main = require('./bundle.js');

main();

async function main()
{
    await Main.main('./dist/config.json');
}