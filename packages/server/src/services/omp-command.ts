export function resolveOmpCommand(env: NodeJS.ProcessEnv = process.env): string {
  return env.OMP_COMMAND ?? "omp";
}
