import chalk from 'chalk';
import * as Menu from './Menu.js';

export function printMainMenu(ctx = {})
{
    Menu.printTitle();
    Menu.println();
    Menu.println("Loading config file...");

    if ('configPath' in ctx)
    {
        Menu.println("Found config file.");
    }
    else
    {
        Menu.println("No config specified. Loading default config instead...");
    }

    Menu.print();
}