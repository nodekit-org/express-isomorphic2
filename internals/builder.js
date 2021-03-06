const argv = require('yargs').argv;
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const { log } = require('./internalUtils');

const cwd = process.cwd();

(async function builder() {
  try {
    if (argv.p !== undefined) {
      const buildFilePath = path.resolve(cwd, 'packages', argv.p, 'scripts', 'build.js');
      log('builder(): buildFilePath: %s', buildFilePath);

      if (fs.existsSync(buildFilePath)) {
        executeBuild(buildFilePath);
      } else {
        log('builder(): buildFilePath does not exist: %s', buildFilePath);
      }
    } else {
      const packagesPath = path.resolve(cwd, 'packages');
      const packages = fs.readdirSync(packagesPath);
      for (let i = 0; i < packages.length; i++) {
        const stat = fs.lstatSync(path.resolve(packagesPath, packages[i]));
        if (stat.isDirectory()) {
          const buildFilePath = path.resolve(
            packagesPath,
            packages[i],
            'scripts',
            'build.js',
          );
          if (fs.existsSync(buildFilePath)) {
            log('builder(): buildFile found: %s, running "build"', buildFilePath);
            await executeBuild(buildFilePath);
          }
        }
      }
    }
  } catch (err) {
    log('builder(): error', err);
  }
})();

function executeBuild(buildFilePath) {
  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(
      'node',
      [
        buildFilePath,
      ],
      {
        stdio: 'inherit',
      },
    );

    child.on('error', (err) => {
      reject(err);
    });

    child.on('exit', () => {
      resolve(true);
    });
  });
}
