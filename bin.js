#!/usr/bin/env node
// Handle EPIPE errors when user doesn't put quotes around output file name with parameters
function epipeError(err) {
  if (err.code === 'EPIPE' || err.errno === 32) return process.exit;

  if (process.stdout.listeners('error').length <= 1) {
    process.stdout.removeAllListeners();
    process.stdout.emit('error', err);
    process.stdout.on('error', epipeError);
  }
}

process.stdout.on('error', epipeError);

const fs = require('fs-extra');
const index = require('./index');
const opn = require('opn');
const os = require('os');
const yargs = require('yargs');

const argv = yargs
    .usage('Rename-CLI v' + require('./package.json').version + '\n\nUsage:\n\n  rename [options] file(s) new-file-name')
    .options({
      'h': {
        alias: 'help'
      }, 'i': {
        alias: 'info',
        boolean: true,
        describe: 'View online help'
      }, 'u': {
        alias: 'undo',
        boolean: true,
        describe: 'Undo previous rename operation'
      }, 'r': {
        alias: 'regex',
        describe: 'See RegEx section of online help for more information',
        type: 'string'
      }, 'f': {
        alias: 'force',
        boolean: true,
        describe: 'Force overwrite without prompt when output file name already exists'
      }, 's': {
        alias: 'sim',
        boolean: true,
        describe: 'Simulate rename and just print new file names'
      }, 'n': {
        alias: 'noindex',
        boolean: true,
        describe: 'Do not append an index when renaming multiple files'
      }, 'v': {
        alias: 'verbose',
        boolean: true,
        describe: 'Print all rename operations completed'
      }
    })
    .help('help')
    .epilogue('Variables:\n\n' + index.getReplacements())
    .wrap(yargs.terminalWidth())
    .argv;

const userReplacements = os.homedir() + '/.rename/replacements.js';

// check if ~/.rename/replacements.js exists, if not create it and
// then copy in the text from ./userReplacements.js
fs.ensureFile(userReplacements, err => {
  if (err) throw err;
  fs.readFile(userReplacements, 'utf8', (er, data) => {
    if (er) throw er;
    if (data === '') {
      fs.readFile(__dirname + '/lib/userReplacements.js', 'utf8', (ex, usrRep) => {
        if (ex) throw ex;
        fs.writeFile(userReplacements, usrRep, (e) => {
          if (e) throw e;
          parseArgs();
        });
      });
    } else {
      parseArgs();
    }
  });
});

function parseArgs() {
  if (argv.i) { // view online hlep
    opn('https://github.com/jhotmann/node-rename-cli');
    if (process.platform !== 'win32') {
      process.exit(0);
    }
  } else if (argv.u) { // undo previous rename
    index.undoRename();
  } else if (argv._.length > 1) { // proceed to index.js to do the rename
    index.thecommand(argv);
  } else {
    console.log('ERROR: Not enough arguments specified. Type rename -h for help');
    process.exit(1);
  }
}