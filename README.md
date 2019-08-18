# Progress Auditor
*CSE 197 Submission Management Program*

Created by Professor Mia Minnes

Developed by Andrew Kuo

---

## Purpose
To make a program that streamlines and tracks the grading and logistics of discussion-based turnin processes.

## Table of Contents
* [Usage](#usage)
* [Getting Started](#setting-up-the-workspace)
* [Running the Program](#running-the-program)
* [Project Structure](#project-structure)
  * [Entry Point](#entry-point)

---

## Compatibility
- [x] Windows
- [x] Mac
- [x] Linux

---

## Usage
Make sure to choose the correct executable for your platform. Each executable file name is appended by its appropriate platform.

You can double-click to run them in interactive mode or execute them in the terminal (or command prompt) to supply additional arguments.

## Getting Started

### Installing [Node.js](https://nodejs.org/en/)
This is required to test the program. Just get the current version and install it.

### Installing [Git](https://git-scm.com/)
This is required to edit the program remotely. Just get the current version and install it. The repository is hosted at [GitHub](https://github.com/andykuo1/flapjs).

### Installing [VS Code](https://code.visualstudio.com/)
This is not required, but recommended (by me). Just get the current version and install it.

Otherwise, you just need a text editor to write JavaScript, HTML, and CSS.

**Note:** Be sure to get the compatible versions for your operating system.

#### Recommended VS Code Packages
* [Excel Viewer](https://marketplace.visualstudio.com/items?itemName=GrapeCity.gc-excelviewer)
  * Let's you look at CSV files with filters.
* [vscode-pdf](https://marketplace.visualstudio.com/items?itemName=tomoki1207.pdf)
  * Allows you to open and view PDF files.

### Getting the remote repository
Open a command line or terminal and enter a directory to where to copy the project repository. This can be anywhere in your local file system (like your home directory). For example:

```
cd ~/
```

Then, clone the [repo](https://github.com/JFLAP/JFLAP-WebApp.git) to the directory.

```
git clone https://github.com/JFLAP/JFLAP-WebApp.git
```

Navigate into the directory of the repository.

```
cd JFLAP-WebApp
```

To ensure and verify the state of the repository enter the following command:

```
git status
```

### Installing dependencies
Open a command line or terminal and enter into the project directory. This should be where you've copied the remote repository. Following the previous example:

```
cd ~/JFLAP-WebApp
```

If you want to inspect the contents of this directory, it should contain the project files, such as `package.json`.

Then run the following command:

```
npm install
```

This should automatically start installing the dependencies (as listed in `package.json`). After it finishes, it should create a directory called `node_modules`, which contains all required dependencies.

**Note:** The `node_modules` directory sometimes contains files unique to each platform so this directory SHOULD NOT be committed to the repository.

**Note:** If a `package-lock.json` is created, it should be committed to the repo. It should not be ignored.

After that, the project is ready to run. _Happy coding!_

---

## Running the Program
After saving any changes to a file, open a command line or terminal and enter into the project directory.

**Note:** If using the recommended `VS Code` package, the in-editor terminal is automatically opened at the project directory. (No need to `cd` every time!)

### Production Build
To "compile" the scripts for public distribution:

```
npm run build
```

**Note:** This will bundle all the resources and assets required into `dist`. It will also "uglify" the code to reduce size and apply other optimizations.

Then, open the program. Either by just opening the outputted executable file itself or running the command:

```
npm start
```

### Development Build
Currently there is no other way to build the project. Due to its rather small size, building the production build every time is not a huge concern.

---

## Project Structure

### Entry point
The entry point for the code is in `src/bin.js` (if bundled, this will be referred to by `package.json` through the property `bin`).

This script manages the interactive menu and handles starting the program. For the actual implementations, you should checkout `main.js`. It handles the imports/exports used and also the lifecycle of the program itself.

### Conclusion

If you have any more questions, please contact Professor Mia Minnes or Andrew Kuo.

Or, you can contact me:
ank060@ucsd.edu
(Please begin the subject with 'UCSD Progress Auditor - ');

Thank you for reading me!