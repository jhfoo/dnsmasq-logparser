const ChildProcess = require('child_process'),
  fs = require('fs'),
  path = require('path'),
  { ServiceBroker } = require('moleculer'),
  ApiGateway = require('moleculer-web'),
  PromClient = require('prom-client'),
  Tail = require('tail').Tail

const DEFAULT_WATCHFILE = '/var/log/dnsmasq.log'
const WatchFile = process.argv.length > 2 ? process.argv[2] : DEFAULT_WATCHFILE

const broker = new ServiceBroker()
const ApiSvc = broker.createService({
  name: 'api',
  mixins: [ApiGateway],
  settings: {
    port: 3030,
    ip: '0.0.0.0',
  },
  actions: {
    async clearLog(ctx) {
      try {
        let stdout = await execWait('service dnsmasq stop')
        console.log(`stdout: ${stdout}`)
    
        stdout = await execWait('rm /var/log/dnsmasq.log')
        console.log(`stdout: ${stdout}`)
    
        stdout = await execWait('service dnsmasq start')
        console.log(`stdout: ${stdout}`)
      } catch (err) {
        console.error(err)
        return err.message
      }    
    },
  },
})

broker.start()
.catch((err) => {
  console.error(`Moleculer fatal error: ${err}`)
})

console.log(`Watch: ${WatchFile}`)
let tail = new Tail(WatchFile)

initTailEvents(tail)

// setTimeout(async () => {
//   await clearLog()
// }, randomInterval())

function initTailEvents(tail) {
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
    tail.unwatch()
    checkFileExist()
  })
}

function checkFileExist() {
  console.log(`Monitoring file presence: ${WatchFile}`)
  if (fs.existsSync(WatchFile)) {
    console.log(`File is present: ${WatchFile}`)
    tail = new Tail(WatchFile)
    initTailEvents(tail)
  } else {
    setTimeout(() => {
      checkFileExist()
    }, 1 * 500)
  }
}


function randomInterval() {
  return (5 * 60 + Math.floor(Math.random() * 60)) * 1000
}

async function doCleanup() {
  await clearLog()

  setTimeout(async () => {
    await clearLog()
  }, randomInterval())  
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