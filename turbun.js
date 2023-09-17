const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { promisify } = require('util');
const net = require('net');

const appsDir = path.join(__dirname, 'src/apps');
const clientsDir = path.join(appsDir, 'clients');

const readdirAsync = promisify(fs.readdir);

async function getDirectories(directory) {
  try {
    const dirents = await readdirAsync(directory, { withFileTypes: true });
    return dirents
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return [];
  }
}

function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen({ port: startPort }, () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });
  });
}

async function getProjectPorts(clientDirs, portOffset) {
  const projectPorts = {};

  for (let i = 0; i < clientDirs.length; i++) {
    const clientDir = clientDirs[i];
    const port = portOffset + i;
    const availablePort = await findAvailablePort(port);
    projectPorts[clientDir] = availablePort;
  }

  return projectPorts;
}

async function runParallelCommands() {
  const clientDirs = await getDirectories(clientsDir);

  if (clientDirs.length === 0) {
    console.log('src/apps/clients client app not found in apps/clients');
    return;
  }

  const portOffset = 3000; // Starting port number
  const projectPorts = await getProjectPorts(clientDirs, portOffset);

  const commands = clientDirs.map((clientDir) => {
    const port = projectPorts[clientDir];
    const coloredClientDir = chalk.keyword(getRandomColor())(clientDir);

    // Determine the script to use based on availability
    let script = 'start'; // Default to 'start'
    const packageJsonPath = path.join(clientsDir, clientDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = require(packageJsonPath);
      if (packageJson.scripts && packageJson.scripts.dev) {
        script = 'dev';
      }
    }

    // Generate the lerna exec command for each client directory
    return `lerna exec --parallel --scope ${clientDir} -- bun ${script} --port ${port} &`;
  });

  // Combine and execute the generated commands
  const combinedCommand = commands.join(' ');

  console.log('Starting projects...'); // Add loading message

  const childProcess = exec(combinedCommand);

  childProcess.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  childProcess.on('exit', (code) => {
    if (code === 0) {
      console.log('All projects started.');
    } else {
      console.error(`Error: Process exited with code ${code}`);
    }
  });
}

function getRandomColor() {
  const colors = ['red', 'green', 'blue', 'yellow', 'magenta', 'cyan', 'white', 'gray'];
  return colors[Math.floor(Math.random() * colors.length)];
}

runParallelCommands();
