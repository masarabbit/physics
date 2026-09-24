
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

  // const degToRad = deg => deg / (180 / Math.PI)
  const radToDeg = rad => Math.round(rad * (180 / Math.PI))

  // const rotatePoint = ({ angle, axis, point }) =>{
  //   const a = degToRad(angle)
  //   const aX = point.x - axis.x
  //   const aY = point.y - axis.y
  //   return {
  //     x: (aX * Math.cos(a)) - (aY * Math.sin(a)) + axis.x,
  //     y: (aX * Math.sin(a)) + (aY * Math.cos(a)) + axis.y,
  //   }
  // }

  const angleTo = ({ a, b }) => Math.atan2(b.y - a.y, b.x - a.x)
  // const nearest360 = n => n === 0 ? 0 : (n - 1) + Math.abs(((n - 1) % 360) - 360)

  const setAngle = ({ el, deg }) =>{
    el.style.transform = `rotate(${deg || 0}deg)`
  }



  const machineHandle = document.querySelector('.handle')
  const machineCircle = document.querySelector('.circle')

  const machineTop = {
    el: document.querySelector('.top'),
  }
  const {width, height} = machineTop.el.getBoundingClientRect()
  machineTop.size = { w: width, h: height }

   const machineBottom = {
    el: document.querySelector('.bottom'),
  }
  const {width: bottomWidth, height: bottomHeight } = machineBottom.el.getBoundingClientRect()
  machineBottom.size = { w: bottomWidth, h: bottomHeight }


    const handleAxis = () => {
    const { left: handleX, top: handleY } = machineCircle.getBoundingClientRect()
    const { top, left } = machineBottom.el.getBoundingClientRect()
    return {
      x: handleX - left + 80,
      y: handleY - top + 80
    }
  }

  const settings = {
    capsules: [],
    friction: 0.9,
    bounce: -0.4,
    gravity: 4,
    radius: 36,
    isTurningHandle: false,
    isHandleLocked: false,
    prevHandleDeg: 0,
    handleDeg: 0,
  }

  const chainActions = (actor, actions, i = 0) => {
    actions[i].action(actor)
    if (i < actions.length - 1) setTimeout(()=> {
      chainActions(actor, actions, i + 1)
    }, actions[i].delay || 0)
  }

  class Squirrel {
    constructor(){
      this.el = Object.assign(document.createElement('div'), {
        className: 'squirrel-wrapper',
        innerHTML: 
          '<div class="squirrel"></div>'
      })
     
      this.setPos({ x: machineTop.size.w / 2, y: machineTop.size.h })
    }
    getNearestCapsule(pos) {
      const { id } = settings.capsules.map(c => ({ dist: c.distanceBetween(pos), id: c.id })).sort((a, b) => a.dist - b.dist)[0]
      return settings.capsules.find(c => c.id === id)
    }
    popUp() {
      // TODO we should vary what the nearestCapsule becomes each time.
      const capsule = this.getNearestCapsule({ x: machineTop.size.w / 2, y: machineTop.size.h })

      const config = capsule.pos.x >=  machineTop.size.w / 2
        ? {
          dir: 'right',
          offset: -20
        }
        : {
          dir: 'left',
          offset: 20,
        }
      const distance = capsule.distanceBetween({ x:  machineTop.size.w / 2 + config.offset, y: machineTop.size.h})
      const walkDelay = distance * 10

      chainActions(this, [
        ...(this.hasReleasedCapsule ? [{
          action: a => {
            a.el.setAttribute('dir', 'right')
            a.el.setAttribute('pose', 'walk')
            a.setPos({ x: machineBottom.size.w + 200, y: machineBottom.size.h - 20 })
          },
          delay: 2000,
        }] : []),
        {
          action: a => {
            a.setPos({ x: machineTop.size.w / 2, y: machineTop.size.h })
            machineTop.el.appendChild(a.el)
            a.el.setAttribute('pose', 'jump-up')
          },
          delay: 650,
        },
        ...(distance > 100 ? [{
          action: a => {
            a.el.setAttribute('dir', config.dir)
            a.el.setAttribute('pose', 'walk')
            a.setPos({
              x: capsule.pos.x + config.offset,
              y: a.pos.y
            })
          },
          delay: walkDelay,
        }] : []),
        {
          action: a => a.el.setAttribute('pose', 'grab'),
          delay: 500,
        },
        {
          action: () => capsule.remove(),
          delay: 800,
        },
        {
          action: a => {
            capsule.setPos({ x: -52, y: -30 })
            a.el.appendChild(capsule.el)
            capsule.el.classList.remove('disappear')
        
            a.setPos({ x: machineBottom.size.w + 200, y: machineBottom.size.h - 20 })
            a.el.setAttribute('pose', 'roll')
            machineBottom.el.appendChild(a.el)
          },
          delay: 500,
        },
        {
          action: a => {
            capsule.deg -= 360
            capsule.setPos()
            a.setPos({ x: 100, y: machineBottom.size.h - 20 })
          },
          delay: 2000,
        },
        {
          action: a => {
            a.el.setAttribute('pose', 'neutral')
            // TODO we should perhaps keep this locked until the capsule is collected
            settings.isHandleLocked = false
            capsule.setPos({ x: 48, y: machineBottom.size.h - 50 })
            machineBottom.el.appendChild(capsule.el)
            a.hasReleasedCapsule = true
          },
        },
      ])
    }
    setPos(pos) {
      this.pos = pos
      this.el.style.transform = 
        `translate(${pos.x}px, ${pos.y}px)`
    } 
  }

  class Capsule {
    constructor({ pos = { x: 0, y: 0 }, id}) {
      this.el = Object.assign(document.createElement('div'), {
        className: 'capsule-wrapper',
        innerHTML: 
          '<div class="capsule">' +
          '<div class="lid"></div><div class="base"></div>' +
          '</div>'
      })
      this.pos = new Vector({ x: pos.x, y: pos.y })
      this.id = id
      this.prevPos = { x: null, y: null }
      this.velocity = new Vector({ x: 0, y: 0.1 })
      this.acceleration = new Vector({ x: 0, y: settings.gravity })
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
    setPos(pos) {
      if (pos) this.pos = pos
      const { x, y } = this.pos
      this.el.style.transform = 
        `translate(${x}px, ${y}px) rotate(${this.deg || 0}deg`
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
    remove() {
      this.el.classList.add('disappear')
      settings.capsules = settings.capsules.filter(c => c !== this) 
      setTimeout(()=> {
        // this.el.remove()
        settings.selectedCapsule = this
      }, 500)
  
    }
  }


  new Array(20).fill('').forEach((_, i)=> new Capsule({ id: i, pos: {x: (i % 5) * 64 + settings.radius, y: Math.floor(i / 5) * 64 + settings.radius}}))


  setInterval(() => {
    settings.capsules.forEach(c => c.move())
  }, 100)

  settings.squirrel = new Squirrel()

  window.addEventListener('keyup', e => {
    if (e.key === 'Enter') console.log(settings)
  })


  const grabHandle = e => {
    if (settings.isHandleLocked) return
    const { top, left } = machineBottom.el.getBoundingClientRect()
    settings.isTurningHandle = true
    settings.handleDeg = radToDeg(angleTo({
      a: {
        x: e.pageX - left,
        y: e.pageY - top
      },
      b: handleAxis()
    }))
    settings.handleRotate = 0
  }

  const releaseHandle = () => {
    settings.isTurningHandle = false
    setAngle({
      el: machineHandle,
      deg: 0
    })
  }

  const release = () => {
    settings.isHandleLocked = true
    settings.squirrel.popUp()
  }

  const rotateHandle = e => {
    if (!settings.isTurningHandle || settings.isHandleLocked) return
    const { top, left } = machineBottom.el.getBoundingClientRect()
  
    settings.prevHandleDeg = settings.handleDeg 
    const deg = radToDeg(angleTo({
      a: { x: e.pageX - left, y: e.pageY - top },
      b: handleAxis()
    }))
    settings.handleDeg = deg

    const diff = settings.handleDeg - settings.prevHandleDeg
    
    if (diff >= 1) {
      setAngle({
        el: machineHandle,
        deg: settings.handleRotate
      })
    }

    if (diff > 0 && diff < 50) settings.handleRotate += diff
    if (settings.handleRotate > 350) {
      setAngle({
        el: machineHandle,
        deg: 10
      })
      release()
      settings.isTurningHandle = false
    }
  }

  machineHandle.addEventListener('pointerdown', grabHandle)
  ;['pointerup', 'pointercancel'].forEach(action => window.addEventListener(action, releaseHandle))
  window.addEventListener('pointermove', rotateHandle) 
})



