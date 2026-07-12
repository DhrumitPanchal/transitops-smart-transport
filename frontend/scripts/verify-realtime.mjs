import { runRealtimeVerification } from '../src/realtime/realtime.verify.js'

try {
  const results = runRealtimeVerification()
  for (const line of results) {
    process.stdout.write(`PASS ${line}\n`)
  }
  process.stdout.write(
    `\nRealtime verification passed (${results.length} checks).\n`,
  )
} catch (error) {
  process.stderr.write(`FAIL ${error.message}\n`)
  process.exitCode = 1
}
