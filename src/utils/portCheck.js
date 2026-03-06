import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkPort(port) {
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (error) {
        resolve(false);
      } else {
        resolve(stdout.includes(`:${port}`));
      }
    });
  });
}

async function killProcessOnPort(port) {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    const lines = stdout.trim().split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5 && parts[1].includes(`${port}`)) {
        const pid = parts[parts.length - 1];
        try {
          await execAsync(`taskkill /F /PID ${pid}`);
          console.log(`Killed process ${pid} on port ${port}`);
        } catch (err) {
          console.log(`Could not kill process on port ${port}: ${err.message}`);
        }
      }
    }
  } catch (error) {
    console.log(`No process found on port ${port}`);
  }
}

export { checkPort, killProcessOnPort };
