const mineflayer = require('mineflayer')
const fs = require('fs')

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'))

const SERVER = 'muthserver.aternos.me'
const PORT = 25565
const PASSWORD = 'njbruto'
const JUMP_INTERVAL = 30 * 1000
const SWITCH_DELAY = 60 * 60 * 1000 // after 1h, try to summon the other

let active = 'Muth'
let bot

function createBot(name) {
  console.log(`Connecting ${name}...`)
  const b = mineflayer.createBot({
    host: SERVER,
    port: PORT,
    username: name,
    auth: 'offline'
  })

  b.on('spawn', () => {
    console.log(`${name} joined the server.`)
    b.chat(`/register ${PASSWORD} ${PASSWORD}`)
    setTimeout(() => b.chat(`/login ${PASSWORD}`), 2000)

    // Anti-AFK
    setInterval(() => {
      if (b.entity) {
        b.setControlState('jump', true)
        setTimeout(() => b.setControlState('jump', false), 300)
      }
    }, JUMP_INTERVAL)

    // After 1 hour, tell the next bot to join (but stay until it joins)
    setTimeout(() => {
      const next = name === 'Muth' ? 'Kali' : 'Muth'
      console.log(`${name}'s shift done. Summoning ${next}...`)
      summonNext(next)
    }, SWITCH_DELAY)
  })

  // Leave only when you *see* the other bot join
  b.on('chat', (username, message) => {
    if (
      (name === 'Muth' && message.includes('Kali joined the game')) ||
      (name === 'Kali' && message.includes('Muth joined the game'))
    ) {
      console.log(`${name} saw ${message}, leaving now.`)
      b.quit()
      setTimeout(() => swap(), 5000) // wait 5s before reconnect
    }
  })

  b.on('kicked', reason => console.log(`${name} kicked:`, reason))
  b.on('error', err => console.log(`Error: ${err.message}`))
  b.on('end', () => console.log(`${name} disconnected.`))

  return b
}

function summonNext(next) {
  // Just switch the active name — the new bot will connect separately
  if (active !== next) {
    console.log(`Preparing ${next} to join...`)
    active = next
    setTimeout(() => {
      bot = createBot(active)
    }, 10000) // wait 10 seconds before connecting to avoid throttle
  }
}

function swap() {
  active = active === 'Muth' ? 'Kali' : 'Muth'
  console.log(`Switching to ${active}...`)
  setTimeout(() => {
    bot = createBot(active)
  }, 10000) // short delay between connections
}

// Start the first bot
bot = createBot(active)
