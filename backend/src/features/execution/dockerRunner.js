// E:\online-judge\backend\src\features\execution\dockerRunner.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const logger = require('../../shared/utils/logger');

const execAsync = promisify(exec);

// run containers are named (no --rm) so we can inspect their exit code /
// OOMKilled flag after they finish, then remove them ourselves.
const LANGUAGE_CONFIG = {
  cpp: {
    image: 'gcc:13',
    filename: 'main.cpp',
    compileCmd: (dir) => `docker run --rm --network none -v "${dir}":/code gcc:13 g++ -O2 -o /code/main /code/main.cpp`,
    runCmd: (dir, name) => `docker run --name ${name} --network none --memory 256m --cpus 0.5 --pids-limit 50 -v "${dir}":/code gcc:13 sh -c "timeout 10 /code/main < /code/input.txt"`,
  },
  python: {
    image: 'python:3.11-slim',
    filename: 'main.py',
    compileCmd: null,
    runCmd: (dir, name) => `docker run --name ${name} --network none --memory 256m --cpus 0.5 --pids-limit 50 -v "${dir}":/code python:3.11-slim sh -c "timeout 10 python3 /code/main.py < /code/input.txt"`,
  },
  java: {
    image: 'eclipse-temurin:17-jdk-jammy',
    filename: 'Main.java',
    compileCmd: (dir) => `docker run --rm --network none -v "${dir}":/code eclipse-temurin:17-jdk-jammy sh -c "cd /code && javac Main.java"`,
    runCmd: (dir, name) => `docker run --name ${name} --network none --memory 256m --cpus 0.5 --pids-limit 50 -v "${dir}":/code eclipse-temurin:17-jdk-jammy sh -c "cd /code && timeout 10 java Main < input.txt"`,
  },
};

const isPullMessage = (text) => {
  return text.includes('Pulling from') ||
    text.includes('Pull complete') ||
    text.includes('Download complete') ||
    text.includes('Unable to find image');
};

// Inspects the finished container for its real exit code + OOMKilled flag,
// then removes it. Never throws — falls back to nulls if inspect fails
// (e.g. the container never got created).
const inspectAndRemove = async (name) => {
  let exitCode = null;
  let oomKilled = false;
  try {
    const { stdout } = await execAsync(`docker inspect --format "{{.State.ExitCode}} {{.State.OOMKilled}}" ${name}`);
    const [codeStr, oomStr] = stdout.trim().split(' ');
    exitCode = parseInt(codeStr, 10);
    oomKilled = oomStr === 'true';
  } catch (e) {
    logger.warn(`docker inspect failed for ${name}: ${e.message}`);
  } finally {
    try {
      await execAsync(`docker rm -f ${name}`);
    } catch (e) {
      // container may already be gone, ignore
    }
  }
  return { exitCode, oomKilled };
};

const runCode = async (submissionId, code, language, input) => {
  const dir = path.join(require('os').tmpdir(), `sub_${submissionId}`);
  const config = LANGUAGE_CONFIG[language];
  const containerName = `sub_${submissionId}_run`.replace(/[^a-zA-Z0-9_.-]/g, '_');

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
      const runCmd = config.runCmd(dockerDir, containerName);
      const { stdout } = await execAsync(runCmd, { timeout: 20000 });
      const executionTime = Date.now() - startTime;

      // exited 0, but still check — cgroup can OOM-kill right at the end
      const { oomKilled } = await inspectAndRemove(containerName);
      if (oomKilled) {
        return { verdict: 'Memory Limit Exceeded', output: '', executionTime };
      }

      return {
        verdict: null,
        output: stdout.trim(),
        executionTime,
      };
    } catch (runErr) {
      const executionTime = Date.now() - startTime;
      const runStderr = runErr.stderr || runErr.message || '';

      // Docker was pulling image during run — not a real verdict, treat as TLE
      if (isPullMessage(runStderr)) {
        await inspectAndRemove(containerName);
        return { verdict: 'Time Limit Exceeded', output: '', executionTime };
      }

      const { exitCode, oomKilled } = await inspectAndRemove(containerName);

      // Order matters: OOM must be checked before TLE, since an OOM-killed
      // process can also look like it "timed out" from the outside.
      if (oomKilled || exitCode === 137) {
        return { verdict: 'Memory Limit Exceeded', output: '', executionTime };
      }

      // exit code 124 = the `timeout 10` wrapper killed the process
      if (exitCode === 124 || executionTime >= 10000 || runErr.killed) {
        return { verdict: 'Time Limit Exceeded', output: '', executionTime };
      }

      // fallback string check, in case inspect couldn't run (e.g. docker
      // daemon hiccup) and we only have stderr to go on
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
      logger.warn(`Cleanup failed for ${dir}`);
    }
  }
};

module.exports = { runCode };
