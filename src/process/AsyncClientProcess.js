import AsyncProcess from './AsyncProcess.js';

class AsyncClientProcess extends AsyncProcess
{
    constructor(defaultResult)
    {
        super(defaultResult);

        // Initialize this only once.
        if (!AsyncClientProcess.INIT)
        {
            AsyncClientProcess.INIT = true;

            const readline = require('readline');
            readline.emitKeypressEvents(process.stdin);
        }

        const inquirer = require('inquirer');
        this.promptModule = inquirer.createPromptModule();
        
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

        this.onEscapeKeyPress = this.onEscapeKeyPress.bind(this);
    }

    /** @override */
    async onSetUp()
    {
        process.stdin.on('keypress', this.onEscapeKeyPress);
        await super.onSetUp();
    }

    /** @override */
    async onRun()
    {
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
        }
    }

    /** @override */
    async onTearDown()
    {
        process.stdin.off('keypress', this.onEscapeKeyPress);
        await super.onTearDown();
    }

    onEscapeKeyPress(ch, key)
    {
        if (key && key.name === 'escape')
        {
            this.cancel();
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
}
AsyncClientProcess.INIT = false;

export default AsyncClientProcess;