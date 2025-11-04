const mineflayer = require('mineflayer')
const fs = require('fs')

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'))

const SERVER = 'muthserver.aternos.me'
const PORT = 25565
const PASSWORD = 'njbruto'
const JUMP_INTERVAL = 30 * 1000
const SWITCH_DELAY = 60 * 60 * 1000 // 1 hour

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

    // Anti-AFK jump
    setInterval(() => {
      if (b.entity) {
        b.setControlState('jump', true)
        setTimeout(() => b.setControlState('jump', false), 300)
      }
    }, JUMP_INTERVAL)

    // After 1 hour, call next bot
    setTimeout(() => {
      const next = name === 'Muth' ? 'Kali' : 'Muth'
      console.log(`${name}'s shift done. Summoning ${next}...`)
      summonNext(next)
    }, SWITCH_DELAY)
  })

  // Leave only if the other bot joins
  b.on('chat', (username, message) => {
    if (
      (name === 'Muth' && message.includes('Kali joined the game')) ||
      (name === 'Kali' && message.includes('Muth joined the game'))
    ) {
      console.log(`${name} saw ${message}, leaving now.`)
      b.quit()
      setTimeout(() => swap(), 10000) // reconnect after 10s
    }
  })

  b.on('kicked', reason => {
    console.log(`${name} kicked:`, reason)
    console.log('Retrying in 10 seconds...')
    setTimeout(() => swap(), 10000)
  })

  b.on('error', err => console.log(`Error: ${err.message}`))
  b.on('end', () => console.log(`${name} disconnected.`))

  return b
}

function summonNext(next) {
  if (active !== next) {
    console.log(`Preparing ${next} to join...`)
    active = next
    setTimeout(() => {
      bot = createBot(active)
    }, 10000)
  }
}

function swap() {
  active = active === 'Muth' ? 'Kali' : 'Muth'
  console.log(`Switching to ${active} in 10 seconds...`)
  setTimeout(() => {
    bot = createBot(active)
  }, 10000)
}

// Start the first bot
bot = createBot(active)

// Keep Render alive (required)
const express = require('express')
const app = express()

app.get('/', (req, res) => res.send('✅ MuthBot is running and connected to the server!'))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`🌐 Web server active on port ${PORT}`))
