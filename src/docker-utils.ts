// dockerUtils.ts
import { spawn as cpSpawn, SpawnOptionsWithoutStdio } from 'child_process';

export function spawn(command: string, args?: ReadonlyArray<string>, options?: SpawnOptionsWithoutStdio) {
    return cpSpawn(command, args, options);
}