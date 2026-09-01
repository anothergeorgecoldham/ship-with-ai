import { spawnSync } from 'node:child_process';

export function run(command, args = [], options = {}) {
  let executable = command;
  let commandArgs = args;

  if (process.platform === 'win32' && command === 'npm') {
    if (!process.env.npm_execpath) {
      throw new Error('On Windows, run this command through its npm script.');
    }
    executable = process.execPath;
    commandArgs = [process.env.npm_execpath, ...args];
  }

  const result = spawnSync(executable, commandArgs, {
    encoding: 'utf8',
    input: options.input,
    env: options.env ?? process.env,
    windowsHide: true,
  });

  if (result.error) {
    throw result.error;
  }

  const stdout = result.stdout?.trim() ?? '';
  const stderr = result.stderr?.trim() ?? '';

  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(stderr || stdout || `${command} exited with status ${result.status}.`);
  }

  return { status: result.status ?? 1, stdout, stderr };
}

export function ghJson(args, options = {}) {
  const result = run('gh', args, options);
  return {
    ...result,
    data: result.stdout ? JSON.parse(result.stdout) : null,
  };
}

export function ghApi(endpoint, options = {}) {
  const args = [
    'api',
    endpoint,
    '--method',
    options.method ?? 'GET',
    '-H',
    'Accept: application/vnd.github+json',
    '-H',
    'X-GitHub-Api-Version: 2022-11-28',
  ];

  const input = options.body === undefined ? undefined : JSON.stringify(options.body);
  if (input !== undefined) {
    args.push('--input', '-');
  }

  return ghJson(args, {
    allowFailure: options.allowFailure,
    input,
  });
}

export function readOption(args, name) {
  const exactIndex = args.indexOf(name);
  if (exactIndex >= 0) {
    const value = args[exactIndex + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`${name} requires a value.`);
    }
    return value;
  }

  const prefix = `${name}=`;
  const inline = args.find((argument) => argument.startsWith(prefix));
  const value = inline?.slice(prefix.length);
  if (inline && !value) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
}

export function hasFlag(args, name) {
  return args.includes(name);
}

export function repositoryDetails(repository) {
  const args = ['repo', 'view'];
  if (repository) {
    args.push(repository);
  }
  args.push('--json', 'nameWithOwner,visibility,defaultBranchRef');
  return ghJson(args).data;
}

export function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
