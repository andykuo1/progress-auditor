import AsyncProcess from './AsyncProcess.js';

const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.on('keypress', onEscapeKeyPress);

const ACTIVE_PROCESS_STACK = [];

function pushActiveProcess(activeProcess)
{
    ACTIVE_PROCESS_STACK.push(activeProcess);
}

function popActiveProcess()
{
    if (ACTIVE_PROCESS_STACK.length <= 0)
    {
        throw new Error('Empty process call stack.');
    }

    return ACTIVE_PROCESS_STACK.pop();
}

function peekActiveProcess()
{
    return ACTIVE_PROCESS_STACK[ACTIVE_PROCESS_STACK.length - 1];
}

function onEscapeKeyPress(ch, key)
{
    if (key && key.name === 'escape')
    {
        if (ACTIVE_PROCESS_STACK.length > 0)
        {
            const activeProcess = peekActiveProcess();
            activeProcess.cancel();
        }
    }
}

class AsyncClientProcess extends AsyncProcess
{
    constructor(defaultResult)
    {
        super(defaultResult);
        
        const inquirer = require('inquirer');
        const inquirerFileTreeSelection = require('inquirer-file-tree-selection-prompt');
        this.promptModule = inquirer.createPromptModule();
        this.promptModule.registerPrompt('file-tree-selection', inquirerFileTreeSelection);
        
        this.cancellable = false;
        this.activePrompt = {
            active: false,
            ui: null,
            reject: null,
            close()
            {
                this.ui.close();
                this.reject('Cancelled by client.');
            }
        };
    }

    /** @override */
    async onRun()
    {
        pushActiveProcess(this);
        this.cancellable = true;
        try
        {
            await super.onRun();
        }
        catch(e)
        {
            throw e;
        }
        finally
        {
            this.cancellable = false;
            popActiveProcess(this);
        }
    }

    cancel()
    {
        if (this.cancellable && this.activePrompt.active)
        {
            this.activePrompt.close();
        }
    }

    async prompt(questions)
    {
        if (!this.ready) throw new Error('Process not yet set up.');
        return await new Promise((resolve, reject) => {
            if (this.activePrompt.active) reject('Cannot start concurrent prompts.');

            const promise = this.promptModule(questions);
            const ui = promise.ui;

            // Prepare current prompt for cancellation... (if it happens)
            this.activePrompt.ui = ui;
            this.activePrompt.reject = reject;
            this.activePrompt.active = true;
            
            promise.then(resolve).catch(reject);
        })
        .finally(() => this.activePrompt.active = false);
    }

    log(message)
    {
        if (!this.ready) throw new Error('Process not yet set up.');
        console.log(message);
    }

    async askConfirm(message)
    {
        const { value } = await this.prompt({ type: 'confirm', name: 'value', message });
        return value;
    }

    async askFileExplorer(message)
    {
        const { path } = await this.prompt({ type: 'file-tree-selection', name: 'path', message});
    }
}

export default AsyncClientProcess;