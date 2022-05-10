const Tail = require('tail').Tail

const DEFAULT_WATCHFILE = '/var/log/dnsmasq.log'
const WatchFile = process.argv.length > 1 ? process.argv[2] : DEFAULT_WATCHFILE

console.log(`Watch: ${WatchFile}`)
const tail = new Tail(WatchFile)

tail.on('line', (data) => {
  const matches = data.match(/query\[A\] (\S+) from (\S+)$/)
  if (matches) {
    console.log(`Query from ${matches[2]}: ${matches[1]}`)
  }
})

tail.on('error', (err) => {
  console.error(err)
})