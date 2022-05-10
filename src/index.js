const ChildProcess = require('child_process'),
  Tail = require('tail').Tail

const DEFAULT_WATCHFILE = '/var/log/dnsmasq.log'
const WatchFile = process.argv.length > 2 ? process.argv[2] : DEFAULT_WATCHFILE

console.log(`Watch: ${WatchFile}`)
const tail = new Tail(WatchFile)

tail.on('line', (data) => {
  let matches = data.match(/query\[A\] (\S+) from (\S+)$/)
  if (matches) {
    console.log(`Query from ${matches[2]}: ${matches[1]}`)
  }

  matches = data.match(/config (\S+) is 0.0.0.0/)
  if (matches) {
    console.log(`BLOCKED: ${matches[1]}`)
  }
})

tail.on('error', (err) => {
  console.error('tail.error')
  console.error(err)
})

setTimeout(async () => {
  await clearLog()
}, 5 * 60 + Math.floor(Math.random() * 60))

async function doCleanup() {
  await clearLog()

  setTimeout(async () => {
    await clearLog()
  }, 5 * 60 + Math.floor(Math.random() * 60))  
}

async function clearLog() {
  try {
    let stdout = await execWait('service dnsmasq stop')
    console.log(`stdout: ${stdout}`)

    stdout = await execWait('rm /var/log/dnsmasq.log')
    console.log(`stdout: ${stdout}`)

    stdout = await execWait('service dnsmasq start')
    console.log(`stdout: ${stdout}`)
  } catch (err) {
    console.error(err)
  }
}

async function execWait(cmd) {
  return new Promise((resolve, reject) => {
    ChildProcess.exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject (err)
        return
      }

      resolve(stdout)
    })
  })
}