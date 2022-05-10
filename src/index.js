const Tail = require('tail').Tail

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
  console.error(err)
})