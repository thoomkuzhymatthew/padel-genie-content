import { spawnSync } from 'node:child_process';
import { requireEnv, projectRoot } from '../env.js';
const ref = new URL(requireEnv('SUPABASE_URL')).hostname.split('.')[0];
if (!/^[a-z]{20}$/.test(ref)) throw new Error('Invalid content project reference');
const [operation, ...rest] = process.argv.slice(2);
const args = operation === 'migrate' ? ['db','push','--remote='+ref,'--skip-vault','--yes']
  : operation === 'query' ? ['db','query','--remote='+ref,...rest]
  : operation === 'config' ? ['config','push','--remote='+ref,'--yes'] : null;
if (!args) throw new Error('Usage: tsx pipeline/db/cli.ts migrate | query <sql or flags> | config');
const result = spawnSync('npx', ['--yes','supabase@3.0.0',...args], { cwd: projectRoot, stdio: 'inherit' });
process.exitCode = result.status ?? 1;
