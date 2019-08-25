const MOTIVATIONS = [
    "I believe in you.",
    "You are almost there.",
    "Have a hug. <3",
    "Clam's are good.",
    "It's okay. You've made progress!",
    "At least it's something.",
    "A lot of progress, you've made.",
    "Don't worry. I got your back.",
    "You are doing good. Keep it up!",
    "You can do this.",
    "Sometimes, I just want to eat clams.",
    "Uh oh. That doesn't look good.",
    "Are you okay?",
    "Have you seen any clams around here?",
    "Found any clams lately?",
    "I like clams.",
    "I got 3 words: Giant. Clams.",
    "I hope this is helpful.",
    "It's better to get an error than to get nothing.",
    "I wonder if clams dream about me.",
    "Clams?",
    "Take a break. You deserve it.",
    "Come back in a few minutes. I know you can do it.",
    "Come back in a couple. I'll be here.",
    "That was unexpected.",
    "That's weird.",
    "Where did that come from?",
    "We can share the clam.",
    "I think...I am a clam-lover.",
    "Who's jgs?",
];

export function getMotivation(index = -1)
{
    if (index < 0 || index >= MOTIVATIONS.length)
    {
        index = Math.floor(Math.random() * MOTIVATIONS.length);
    }
    return MOTIVATIONS[index];
}

export function say(message = "...")
{
    console.log(chalk.green(otter(message)));
}

function otter(message)
{
    return `
     .-"""-.
    /      o\\     ${message}
   |    o   0).-.
   |       .-;(_/     .-.
    \\     /  /)).---._|  \`\\   ,
     '.  '  /((       \`'-./ _/|
       \\  .'  )        .-.;\`  /
        '.             |  \`\\-'
          '._        -'    /
    jgs      \`\`""--\`------\`
    `;
}
