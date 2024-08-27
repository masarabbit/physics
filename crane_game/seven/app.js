
function init() { 

  const setStyles = ({ el, x, y, w, h, deg }) =>{
    if (w) el.style.width = px(w)
    if (h) el.style.height = px(h)
    el.style.transform = `translate(${x ? px(x) : 0}, ${y ? px(y) : 0}) rotate(${deg || 0}deg)`
  }
  const px = num => `${num}px`

  const degToRad = deg => deg / (180 / Math.PI)
  const radToDeg = rad => Math.round(rad * (180 / Math.PI))
  const angleTo = ({ a, b }) => Math.atan2(b.y - a.y, b.x - a.x)
  const distanceBetween = ({ a, b }) => Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2))


  const ePos = (e, type) => Math.round(e.type[0] === 'm' ? e[`page${type}`] : e.touches[0][`page${type}`])
  const addEvents = (target, event, action, array) => {
    array.forEach(a => event === 'remove' ? target.removeEventListener(a, action) : target.addEventListener(a, action))
  }

  const mouse = {
    up: (t, e, a) => addEvents(t, e, a, ['mouseup', 'touchend']),
    move: (t, e, a) => addEvents(t, e, a, ['mousemove', 'touchmove']),
    down: (t, e, a) => addEvents(t, e, a, ['mousedown', 'touchstart']),
    enter: (t, e, a) => addEvents(t, e, a, ['mouseenter', 'touchstart']),
    leave: (t, e, a) => addEvents(t, e, a, ['mouseleave'])
  }

  const settings = {
    k: 0.8,
    friction: 0.8,
    bounce: -0.5,
    shapes: [],
    interval: null,
    // grabInterval: null,
    gravity: 10,
    // grabbedBlock: null
  }


  const elements = {
    wrapper: document.querySelector('.wrapper'),
    machine: document.querySelector('.machine'),
    indicator: document.querySelector('.indicator'),
    testBtn: document.querySelector('.test-btn'),
    machineArm: {
      el: document.querySelector('.machine-arm-wrapper'),
      motion: null,
      x: 0,
      y: 0,
      arm: {
        el: document.querySelector('.arm'),
        y: 0,
        h: 60,
      }
    }
  }

  const vector = {
    x: 0,
    y: 0,
    create: function(x, y) {
      const obj = Object.create(this)
      obj.x = x
      obj.y = y
      return obj
    },
    setXy: function({ x, y }) {
      this.x = x
      this.y = y
    },
    setAngle: function(angle) {
      const length = this.magnitude()
      this.x = Math.cos(angle) * length
      this.y = Math.sin(angle) * length
    },
    setLength: function(length) {
      const angle = Math.atan2(this.y, this.x)
      this.x = Math.cos(angle) * length
      this.y = Math.sin(angle) * length
    },
    magnitude: function() {
      return Math.sqrt(this.x * this.x + this.y * this.y)
    },
    multiply: function(n) {
      return this.create(this.x * n, this.y * n)
    },
    addTo: function(v2) {
      this.x += v2.x
      this.y += v2.y
    },
    subtract: function(v2) {
      return this.create(this.x - v2.x, this.y - v2.y)
    },
    multiplyBy: function(n) {
      this.x *= n
      this.y *= n
    },
  }

  const createShape = () => {
    const shape = {
      ...vector,
      radius: 40, // TODO this isn't measuring from the center
      el: Object.assign(document.createElement('div'), { className: 'shape',
        x: 0,
        y: 0,
        innerHTML: [
            -45,
            0,
            45,
            -90,
            0,
            90,
            -135,
            0,
            135
          ].map(angle => `<div class="cell" data-angle=${angle}></div>`).join('')
        })
    }
    shape.velocity = shape.create(0, 0)
    shape.velocity.setLength(0)
    shape.velocity.setAngle(degToRad(90))

    shape.acceleration = shape.create(0, 1)  
    shape.accelerate = function(acceleration) {
      this.velocity.addTo(acceleration)
    }
    settings.shapes.push(shape)
    elements.machine.append(shape.el)
  }

  const animateShapes = () => {
    settings.shapes.forEach(shape => {      
      // spaceOutBlocks(block)
      hitCheckWalls(shape)
      animateShape(shape)
      // console.log(shape.y)
    })
  }

  const animateShape = shape => {
    shape.accelerate(shape.acceleration)
    shape.velocity.multiplyBy(settings.friction)
    shape.addTo(shape.velocity)
    setStyles(shape)
  }


  const { width: machineWidth, height: machineHeight } = elements.machine.getBoundingClientRect()


  const hitCheckWalls = s => {
    const buffer = 0
    if (s.x + s.radius + buffer > machineWidth) {
      s.x = machineWidth - s.radius
      s.velocity.x *= settings.bounce
    }
    if (s.x - (s.radius + buffer) < 0) {
      s.x = s.radius
      s.velocity.x *= settings.bounce
    } 
    if (s.y + s.radius + buffer > machineHeight) {
      s.y = machineHeight - s.radius
      s.velocity.y *= settings.bounce
    }
    if (s.y - s.radius < 0) {
      s.y = s.radius
      s.velocity.y *= settings.bounce
    }


  }

  createShape()
  setInterval(()=> {
    animateShapes()
  }, 100)

}
window.addEventListener('DOMContentLoaded', init)



