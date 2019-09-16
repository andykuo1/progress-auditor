const chalk = require('chalk');

const MOTIVATIONS = [
    "I believe in you.",
    "You are almost there.",
    "I'm an otter...if you didn't know.",
    "Have a hug. <3",
    "Clam's are good.",
    "It's okay. You'll make progress!",
    "At least it's something.",
    "A lot of progress, you'll make.",
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
    "I thought you were gone forever.",
    "Take a break. You deserve it.",
    "Come back in a few minutes. I know you can do it.",
    "Come back in a couple. I'll be here.",
    "That was unexpected.",
    "That's weird.",
    "Where did that come from?",
    "We can share the clam.",
    "I think...I am a clam-lover.",
    "Who's jgs?",
    "When life gives you lemons, you gotta eat another clam.",
    "Is it Friday?",
    "I wonder who writes these.",
    "I hope that's not too bad.",
    "Nothing to be done.",
    "Together at last!",
    "Yes, let's go . . .",
    "We're gonna need a bigger terminal",
    "I have a good feeling about this.",
    "I wonder where clams go?",
    "Thanks for keeping me company.",
    "I never noticed...Am I green?",
    "I got a tail, and I'm not afraid to use it.",
    "In the beginning, we were all just dots and lines. Now, I'm otter.",
    "Aren't you glad to see me? Cause I am.",
    "Nice to see you again.",
    "Haven't seen you around these parts before...Nah, I'm kidding.",
    "Welcome back.",
    "I wonder what's out there.",
    "Am I floating?",
    "Can I breathe?",
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
