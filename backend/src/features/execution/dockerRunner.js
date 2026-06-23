// E:\online-judge\backend\src\features\execution\dockerRunner.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

const LANGUAGE_CONFIG = {
  cpp: {
    image: 'gcc:13',
    filename: 'main.cpp',
    compileCmd: (dir) => `docker run --rm -v "${dir}":/code gcc:13 g++ -O2 -o /code/main /code/main.cpp`,
    runCmd: (dir) => `docker run --rm --network none --memory 256m --cpus 0.5 --pids-limit 50 -v "${dir}":/code gcc:13 sh -c "timeout 10 /code/main < /code/input.txt"`,
  },
  python: {
    image: 'python:3.11-slim',
    filename: 'main.py',
    compileCmd: null,
    runCmd: (dir) => `docker run --rm --network none --memory 256m --cpus 0.5 --pids-limit 50 -v "${dir}":/code python:3.11-slim sh -c "timeout 10 python3 /code/main.py < /code/input.txt"`,
  },
  java: {
    image: 'eclipse-temurin:17-jdk-jammy',
    filename: 'Main.java',
    compileCmd: (dir) => `docker run --rm -v "${dir}":/code eclipse-temurin:17-jdk-jammy sh -c "cd /code && javac Main.java"`,
    runCmd: (dir) => `docker run --rm --network none --memory 256m --cpus 0.5 --pids-limit 50 -v "${dir}":/code eclipse-temurin:17-jdk-jammy sh -c "cd /code && timeout 10 java Main < input.txt"`,
  },
};

const isPullMessage = (text) => {
  return text.includes('Pulling from') ||
    text.includes('Pull complete') ||
    text.includes('Download complete') ||
    text.includes('Unable to find image');
};

const runCode = async (submissionId, code, language, input) => {
  const dir = path.join(require('os').tmpdir(), `sub_${submissionId}`);
  const config = LANGUAGE_CONFIG[language];

  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, config.filename), code);
    fs.writeFileSync(path.join(dir, 'input.txt'), input || '');

    const dockerDir = process.platform === 'win32'
      ? dir.replace(/\\/g, '/').replace(/^([A-Z]):/, (_, l) => `/${l.toLowerCase()}`)
      : dir;

    // compile if needed
    if (config.compileCmd) {
      try {
        await execAsync(config.compileCmd(dockerDir), { timeout: 30000 });
      } catch (compileErr) {
        const compileStderr = compileErr.stderr || compileErr.message || '';

        if (isPullMessage(compileStderr)) {
          // Docker was pulling the image — retry once
          try {
            await execAsync(config.compileCmd(dockerDir), { timeout: 30000 });
          } catch (retryErr) {
            return {
              verdict: 'Compile Error',
              output: retryErr.stderr || retryErr.message,
              executionTime: 0,
            };
          }
        } else {
          return {
            verdict: 'Compile Error',
            output: compileStderr,
            executionTime: 0,
          };
        }
      }
    }

    // run
    const startTime = Date.now();
    try {
      const runCmd = config.runCmd(dockerDir);
      const { stdout, stderr: runStderr } = await execAsync(runCmd, { timeout: 20000 });
      const executionTime = Date.now() - startTime;

      return {
        verdict: null,
        output: stdout.trim(),
        executionTime,
      };
    } catch (runErr) {
      const executionTime = Date.now() - startTime;
      const runStderr = runErr.stderr || runErr.message || '';

      // Docker was pulling image during run
      if (isPullMessage(runStderr)) {
        return { verdict: 'Time Limit Exceeded', output: '', executionTime };
      }

      // timeout kill
      if (executionTime >= 10000 || runErr.killed) {
        return { verdict: 'Time Limit Exceeded', output: '', executionTime };
      }

      // out of memory
      if (runStderr.includes('Killed')) {
        return { verdict: 'Memory Limit Exceeded', output: '', executionTime };
      }

      // runtime error
      return {
        verdict: 'Runtime Error',
        output: runStderr,
        executionTime,
      };
    }
  } finally {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) {
      console.warn('Cleanup failed for', dir);
    }
  }
};

module.exports = { runCode };