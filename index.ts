#!/usr/bin/env node
/* eslint-disable import/no-extraneous-dependencies */

import chalk from 'chalk';
import Commander from 'commander';
import packageJson from './package.json';
import prompts from 'prompts';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

let projectPath: string = '';
const program = new Commander.Command(packageJson.name)
    .version(packageJson.version)
    .arguments('<project-directory>')
    .usage(`${chalk.green('<project-directory>')} [options]`)
    .action((name) => {
        projectPath = name
    })
    .allowUnknownOption()
    .parse(process.argv);

async function run(): Promise<void> {
    if (typeof projectPath === 'string') {
        projectPath = projectPath.trim();
    }

    if (!projectPath) {
        const res = await prompts({
            type: 'text',
            name: 'path',
            message: 'What is your project npm name?',
            initial: 'my-plugin',
            validate: (name) => {
                return true; // TODO: validate name
            },
        });

        if (typeof res.path === 'string') {
            projectPath = res.path.trim();
        }
    }

    const { displayName } = await prompts({
        type: 'text',
        name: 'displayName',
        message: 'What is your project display name?',
        initial: 'My Plugin',
        validate: (name) => {
            return true; // TODO: validate name
        },
    });

    const { apiVersion } = await prompts({
        type: 'text',
        name: 'apiVersion',
        message: 'What plugin api version does your project target?',
        initial: '1.0',
        validate: (name) => {
            return true;
        },
    });

    mkdirSync(projectPath);
    writeFileSync(path.join(projectPath, 'package.json'), `{
    "name": "${projectPath}",
    "version": "1.0.0",
    "description": "",
    "main": "./dist/index.js",
    "scripts": {
        "build": "ncc build ./index.ts -o ./dist/ --minify --no-cache",
        "archive": "npm-pack-zip",
        "postarchive": "renamer --find zip --replace jspz *"
    },
    "prismarine": {
        "apiVersion": "${apiVersion}",
        "displayName": "${displayName}"
    },
    "files": [
        "dist/**/*",
        "package.json",
        "package-lock.json"
    ],
    "license": "ISC",
    "dependencies": { },
    "devDependencies": {
        "@vercel/ncc": "0.24.1",
        "npm-pack-zip": "1.2.7",
        "renamer": "2.0.1"
    }
}`);
    writeFileSync(path.join(projectPath, '.gitignore'), `/node_modules/
/dist/
*.log
.DS_Store`);
    writeFileSync(path.join(projectPath, 'index.ts'), `export default class PluginBase {
    api: any;

    constructor(api: any) {
        this.api = api;
    }

    public async onStart() { }
    public async onExit() { }
}`);
    writeFileSync(path.join(projectPath, 'tsconfig.json'), `{
    "compilerOptions": {
        "target": "es2015",
        "moduleResolution": "node",
        "strict": true,
        "resolveJsonModule": true,
        "esModuleInterop": true,
        "skipLibCheck": false
    }
}`);
    writeFileSync(path.join(projectPath, 'README.md'), `# create-jsprismarine-plugin
## Usage
\`\`\`bash
# Build and minify your source code
$ npm run build

# Package for usage with JSPrismarine
$ npm run archive
\`\`\`

${projectPath}.jspz is the resulting file that should be placed in the \`/plugins\` folder!
`);
}

run()
    .catch(async (reason) => {
        console.log('Aborting installation.')
        if (reason.command) {
            console.log(`  ${chalk.cyan(reason.command)} has failed.`)
        } else {
            console.log(chalk.red('Unexpected error. Please report it as a bug:'))
            console.log(reason)
        }
        process.exit(1)
    });
