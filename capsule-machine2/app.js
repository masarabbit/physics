
window.addEventListener('DOMContentLoaded', ()=>{
  class Vector {
    constructor({ x, y }) {
      Object.assign(this, { x, y })
    }
    setXy(xy) {
      this.x = xy.x
      this.y = xy.y
    }
    addXy(xy) {
      this.x += xy.x
      this.y += xy.y
    }
    multiplyXy(n) {
      this.x *= n
      this.y *= n
    }
  }


  const machineTop = {
    el: document.querySelector('.top'),
  }
  const {width, height} = machineTop.el.getBoundingClientRect()
  machineTop.size = { w: width, h: height }

  const settings = {
    capsules: [],
    friction: 0.9,
    bounce: -0.4,
    gravity: 4,
    radius: 36,
  }

  class Capsule {
    constructor({ pos = { x: 0, y: 0 }}) {
      this.el = Object.assign(document.createElement('div'), {
        className: 'capsule-wrapper',
        innerHTML: 
          '<div class="capsule">' +
          '<div class="lid"></div><div class="base"></div>' +
          '</div>'
      })
      this.pos = new Vector({ x: pos.x, y: pos.y }),
      this.prevPos = { x: null, y: null }
      this.velocity = new Vector({ x: 0, y: 0.1 }),
      this.acceleration = new Vector({ x: 0, y: settings.gravity }),
      this.deg = Math.random() * 360
      settings.capsules.push(this)
      this.setPos()
      machineTop.el.appendChild(this.el)
    }
    getNewPosBasedOnTarget = ({ el, distance: d, fullDistance }) => {
      const remainingD = fullDistance - d
      return {
        x: Math.round(((remainingD * this.pos.x) + (d * el.pos.x)) / fullDistance),
        y: Math.round(((remainingD * this.pos.y) + (d * el.pos.y)) / fullDistance)
      }
    }
    distanceBetween(el) {
      return Math.round(
        Math.sqrt(
          Math.pow(this.pos.x - el.x, 2) + Math.pow(this.pos.y - el.y, 2),
        ),
      )
    }
    accelerate() {
      this.velocity.addXy(this.acceleration)
    }
    setPos() {
      const { x, y } = this.pos
      if (this.prevPos.x === x && this.prevPos.y === y) return
      this.prevPos = { x, y }
      this.el.style.transform = 
        `translate(${this.pos.x}px, ${this.pos.y}px) rotate(${this.deg || 0}deg`
    }
    hitCheckWalls() {
      const buffer = 8
      if (this.pos.x + settings.radius + buffer > machineTop.size.w) {
        this.pos.x = machineTop.size.w - (settings.radius + buffer)
        this.velocity.x *= settings.bounce
      }
      if (this.pos.x - (settings.radius + buffer) < 0) {
        this.pos.x = settings.radius + buffer
        this.velocity.x *= settings.bounce
      }
      if (this.pos.y + (settings.radius + buffer) > machineTop.size.h) {
        this.pos.y = machineTop.size.h - settings.radius - buffer
        this.velocity.y *= settings.bounce
      }
      if (this.pos.y - settings.radius < 0) {
        this.pos.y = settings.radius
        this.velocity.y *= settings.bounce
      }}
    spaceOutObjects() {
      settings.capsules.forEach(o => {
        if (this === o) return
        const distanceBetweenCapsules = this.distanceBetween(o.pos)
        if (distanceBetweenCapsules < (settings.radius * 2)) {
          this.velocity.multiplyXy(0.9)
          const overlap = distanceBetweenCapsules - (settings.radius * 2)
          const  { x, y } = this.getNewPosBasedOnTarget({
              el: o,
              distance: overlap / 2, 
              fullDistance: distanceBetweenCapsules
            })
          if (x) this.pos.x = x
          if (y) this.pos.y = y
        }
      })
    }
    move() {
      this.prevPos.x = this.pos.x
      this.prevPos.y = this.pos.y
      this.accelerate()
      this.velocity.multiplyXy(settings.friction)
      this.pos.addXy(this.velocity)
      this.hitCheckWalls()
      this.spaceOutObjects()

      if (Math.abs(this.prevPos.x - this.pos.x) < 3 && Math.abs(this.prevPos.y - this.pos.y) < 3) {
        this.velocity.setXy({ x: 0, y: 0 })
        this.pos.setXy({ x: this.prevPos.x, y: this.prevPos.y })
      } else {
        if (Math.abs(this.prevPos.x - this.pos.x)) {
          // rotate capsule
          this.deg += (this.pos.x - this.prevPos.x) * 2
        }
      }
  
      this.setPos()
    }
  }


  new Array(20).fill('').forEach((_, i)=> new Capsule({ pos: {x: (i % 5) * 64 + settings.radius, y: Math.floor(i / 5) * 64 + settings.radius}}))


  setInterval(() => {
    settings.capsules.forEach(c => c.move())
  }, 100)

  window.addEventListener('keyup', e => {
    if (e.key === 'Enter') console.log(settings)
  })
})



