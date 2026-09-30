
window.addEventListener('DOMContentLoaded', ()=>{

  //TODO mix up the capsules a bit more
  //TODO make the machine responsive?
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

  const radToDeg = rad => Math.round(rad * (180 / Math.PI))
  const randomN = max => Math.ceil(Math.random() * max)
  const angleTo = ({ a, b }) => Math.atan2(b.y - a.y, b.x - a.x)
  const nearest360 = n => n === 0 ? 0 : (n - 1) + Math.abs(((n - 1) % 360) - 360)

  const setAngle = ({ el, deg }) =>{
    el.style.transform = `rotate(${deg || 0}deg)`
  }

  const wrapper = document.querySelector('.wrapper')
  const collectionBox = document.querySelector('.collection-box')
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

  class Squirrel {
    constructor(){
      this.el = Object.assign(document.createElement('div'), {
        className: 'squirrel-wrapper',
        innerHTML: 
          '<div class="squirrel"></div>'
      })
     
      this.setPos({ x: machineTop.size.w / 2, y: machineTop.size.h })
    }
    chainActions = (actions, i = 0) => {
      actions[i].action(this)
      if (i < actions.length - 1) setTimeout(()=> {
        this.chainActions(actions, i + 1)
      }, actions[i].delay || 0)
    }
    getNearestCapsule(pos) {
      if (Math.random() > 0.3) {
        const filteredCapsules = settings.capsules.filter(c => c.pos.y > machineTop.size.h - 64)
          .map(c => ({ dist: c.distanceBetween(pos), id: c.id }))
        const selectedId = filteredCapsules[Math.floor(Math.random() * filteredCapsules.length)]?.id
        return settings.capsules.find(c => c.id === selectedId)
      }
      return settings.capsules[Math.floor(Math.random() * settings.capsules.length)]
    }
    popUp() {
      const capsule = this.getNearestCapsule({ x: machineTop.size.w / 2, y: machineTop.size.h })

      const walkBack = {
        action: s => {
          s.el.setAttribute('dir', 'right')
          s.el.setAttribute('pose', 'walk')
          s.setPos({ x: machineBottom.size.w + 200, y: machineBottom.size.h })
        },
        delay: 2000,
      }
      const jumpOut = {
        action: s => {
          s.setPos({ x: machineTop.size.w / 2 + 20, y: machineTop.size.h })
          machineTop.el.appendChild(s.el)
          s.el.setAttribute('pose', 'jump-up')
        },
        delay: 650,
      }

      if (!capsule) {
        this.chainActions([
          ...(settings.squirrel.isAtCollectionPoint ? [walkBack] : []),
          jumpOut,
          {
            action: s => {
              s.el.setAttribute('pose', 'neutral')
              s.el.setAttribute('dir', 'left')
              settings.squirrel.isAtCollectionPoint  = false
            },
            delay: 1000,
          },
          {
            action: s => s.el.setAttribute('pose', 'look-around'),
            delay: 3000,
          },
          {
            action: s => s.el.setAttribute('pose', 'neutral'),
            delay: 1000,
          },
          {
            action: s => {
              s.el.setAttribute('pose', 'walk')
              s.setPos({
                x: s.pos.x,
                y: machineTop.size.h + 100
              })
              settings.isHandleLocked = false
            },
          }
        ])
        return
      }
      const distance = Math.abs(capsule.pos.x - machineTop.size.w / 2 + 20)
      const dir = capsule.pos.x > machineTop.size.w / 2 ? 'right' : 'left'
      const offset = (distance < 50 || dir === 'left') ? 20 : -20
      const isJumpGrabbing = (machineTop.size.h - capsule.pos.y) > 45

      this.chainActions([
        ...(settings.squirrel.isAtCollectionPoint ? [walkBack] : []),
        jumpOut,
        ...(distance > 50 ? [{
          action: s => {
            s.el.setAttribute('dir',  dir)
            s.el.setAttribute('pose', 'walk')
            s.setPos({
              x: capsule.pos.x + offset,
              y: s.pos.y
            })
          },
          delay: distance * 10,
        }]: []),
        ...(isJumpGrabbing ? [{
          action: s => {
            s.el.setAttribute('dir',  capsule.pos.x > (capsule.pos.x + offset) ? 'right' : 'left')
            s.el.setAttribute('pose', 'jump-grab')
            s.el.style.setProperty('--jump-speed', `${Math.abs(s.pos.y - capsule.pos.y) / 220}s`) 
            s.setPos({
              x: capsule.pos.x + offset,
              y: capsule.pos.y + 40
            })
          },
          delay: Math.abs(machineTop.size.h - capsule.pos.y) * 5,
        }]:[]),
        {
          action: s => {
            s.el.setAttribute('dir',  capsule.pos.x > (capsule.pos.x + offset) ? 'right' : 'left')
            s.el.setAttribute('pose', 'grab')
          },
          delay: isJumpGrabbing ? 300 : 500,
        },
        {
          action: s => {
            s.setPos({
              x: s.pos.x,
              y: machineTop.size.h + 100
            })
            capsule.setPos({
              x: capsule.pos.x,
              y: machineTop.size.h + (100 - 32)
            })
            capsule.remove()
          },
          delay: 900,
        },
        {
          action: s => {
            capsule.setPos({ x: -52, y: -30 })
            s.el.appendChild(capsule.el)
            s.setPos({ x: machineBottom.size.w + 200, y: machineBottom.size.h - 20 })
            s.el.setAttribute('pose', 'roll')
            machineBottom.el.appendChild(s.el)
          },
          delay: 500,
        },
        {
          action: s => {
            capsule.deg -= 360
            capsule.setPos()
            s.setPos({ x: 100, y: machineBottom.size.h - 20 })
          },
          delay: 2000,
        },
        {
          action: s => {
            s.el.setAttribute('pose', 'neutral')
            capsule.setPos({ x: 48, y: machineBottom.size.h - 50 })
            machineBottom.el.appendChild(capsule.el)
            s.isAtCollectionPoint = true
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

  const getRandomToy = () => {
    return ['blue-hat', 'citrus', 'sleepy-fruit', 'croquette', 'dino', 'panda', 'dino', 'broccoli', 'bear', 'pink-duck', 'cucumber'][randomN(11) - 1]
  }

  class Capsule {
    constructor({ pos = { x: 0, y: 0 }, id}) {
      this.el = Object.assign(document.createElement('div'), {
        className: 'capsule-wrapper',
        innerHTML: 
          '<div class="capsule">' +
          `<div class="lid"></div><div class="base ${['red', 'pink', 'blue', 'white'][Math.floor(Math.random() * 4)]}"></div>` +
          `<div class="toy ${getRandomToy()}"></div>` +
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
      this.toy = this.el.querySelector('.toy')
      this.toyDeg = randomN(180) - randomN(90)
      setAngle({
        el: this.toy,
        deg: this.toyDeg
      })
      this.el.addEventListener('click', ()=> {
        if (settings.isCollecting) return
        this.collect()
      })
    }
    collect() {
      settings.isCollecting = true
      this.el.classList.add('enlarge')
      settings.squirrel.el.setAttribute('pose', 'neutral')
      this.deg = nearest360(this.deg)
      const { width, height } = wrapper.getBoundingClientRect()
      const { left, top } = machineBottom.el.getBoundingClientRect()
      this.setPos({
        x: width / 2 - left, y: height / 2 - top
      })
      setAngle({
        el: this.toy,
        deg: 0
      })
      setTimeout(()=> {
        collectionBox.appendChild(this.toy)
        this.el.remove()
        settings.isHandleLocked = false
        settings.isCollecting = false
      }, 2000)
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
        this.pos.y = machineTop.size.h - settings.radius
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
          setAngle({
            el: this.toy,
            deg: this.toyDeg += (randomN(20) - randomN(10))
          })
        }
      }
  
      this.setPos()
    }
    remove() {
      settings.capsules = settings.capsules.filter(c => c !== this) 
      setTimeout(()=> {
        settings.selectedCapsule = this
      }, 500)
  
    }
  }

  new Array(20).fill('').forEach((_, i)=> new Capsule(
    { 
      id: i, 
      pos: {
        x: (i % 5) * 64 + settings.radius + (i % 2 === 0 ? settings.radius : 0),
        y: Math.floor(i / 5) * 64 + settings.radius
      }
    }
  ))

  setInterval(() => {
    settings.capsules.forEach(c => c.move())
  }, 100)

  settings.squirrel = new Squirrel()

  const grabHandle = e => {
    if (settings.squirrel.isAtCollectionPoint && settings.isHandleLocked) {
      settings.squirrel.el.setAttribute('pose', 'wave')
      return
    }
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
    if (!settings.isTurningHandle) return
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



