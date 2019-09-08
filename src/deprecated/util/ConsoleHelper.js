const readline = require('readline');

const readlineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

export async function question(message)
{
    return new Promise((resolve, reject) => {
        readlineInterface.on('close', reject);
        readlineInterface.question(message, resolve);
    });
}

export async function quit()
{
    readlineInterface.close();
}
