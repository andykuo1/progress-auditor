const readline = require('readline');

const interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function question(message)
{
    return new Promise((resolve, reject) => {
        interface.on('close', reject);
        interface.question(message, resolve);
    });
}

async function quit()
{
    interface.close();
}

module.exports = {
    question,
    quit
};