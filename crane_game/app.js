
function init() { 

  let id = 0

  const setStyles = ({ el, x, y, w, deg }) =>{
    if (w) el.style.width =px(w)
    el.style.transform = `translate(${x ? px(x) : 0}, ${y ? px(y) : 0}) rotate(${deg || 0}deg)`
  }
  const px = num => `${num}px`

  const degToRad = deg => deg / (180 / Math.PI)
  const radToDeg = rad => Math.round(rad * (180 / Math.PI))
  const angleTo = ({ a, b }) => Math.atan2(b.y - a.y, b.x - a.x)
  const distanceBetween = ({ a, b }) => Math.round(Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2)))


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
    // toyNo: 4,
    flapRotate: 0,
    toyColumn: 3,
    toyRow: 3,
    k: 0.08,
    blocks: []
  }

  const elements = {
    wrapper: document.querySelector('.wrapper'),
    machine: document.querySelector('.machine'),
    indicator: document.querySelector('.indicator'),
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

  const createBlock = ({ x, y }) => {
    const block = {
      ...vector,
      el: Object.assign(document.createElement('div'), { className: 'block'}),
      x, 
      y,
      id,
      radius: 15,
      bounce: -0.5,
      friction: 0.9,
    }
    block.velocity = block.create(0, 0)
    block.velocity.setLength(0)
    block.velocity.setAngle(degToRad(90))

    block.acceleration = block.create(0, 2)  
    block.accelerate = function(acceleration) {
      this.velocity.addTo(acceleration)
    }


    setStyles(block)
    elements.machine.append(block.el)
    settings.blocks.push(block)
    addTouchAction(block)
    id++
  }

  const addConnector = (a, b) => {
    const line = {
      el: Object.assign(document.createElement('div'), { className: 'connector'}),
      x: a.x,
      y: a.y,
      deg: radToDeg(angleTo({ a, b })),
      w: distanceBetween({ a, b })
    }
    elements.machine.append(line.el)
    setStyles(line)

    //
    settings.blocks[0].line = line
  }


  const addTouchAction = block =>{
    const onGrab = () =>{
      mouse.up(document, 'add', onLetGo)
      mouse.move(document, 'add', onDrag)
    }
    const onDrag = e =>{
      const x = ePos(e, 'X')
      const y = ePos(e, 'Y')
      const { left, top } = elements.machine.getBoundingClientRect()
      block.x = x - left
      block.y = y - top

      const otherBlockIndex = block.id === 0 ? 1 : 0
      const otherBlock = settings.blocks[otherBlockIndex]
      const d = block.subtract(otherBlock)
      const springForce = d.multiply(settings.k)
      otherBlock.velocity.addTo(springForce)

      otherBlock.accelerate(otherBlock.acceleration)
      otherBlock.velocity.multiplyBy(otherBlock.friction)
      otherBlock.addTo(otherBlock.velocity)
    }
    const onLetGo = () => {
      mouse.up(document, 'remove', onLetGo)
      mouse.move(document,'remove', onDrag)
    }
    mouse.down(block.el,'add', onGrab)
  }

  const getNewPosBasedOnTarget = ({ start, target, distance: d, fullDistance }) => {
    const { x: aX, y: aY } = start
    const { x: bX, y: bY } = target
    const remainingD = fullDistance - d
    return {
      x: Math.round(((remainingD * aX) + (d * bX)) / fullDistance),
      y: Math.round(((remainingD * aY) + (d * bY)) / fullDistance)
    }
  }

  const { width: machineWidth, height: machineHeight } = elements.machine.getBoundingClientRect()

  const hitCheckWalls = b => {
    const buffer = 5
    if (b.x + b.radius + buffer > machineWidth) {
      b.x = machineWidth - (b.radius + buffer)
      b.velocity.x = b.velocity.x * b.bounce
    }
    if (b.x - (b.radius + buffer) < 0) {
      b.x = b.radius
      b.velocity.x = b.velocity.x * b.bounce
    }
    if (b.y + b.radius + buffer > machineHeight) {
      b.y = machineHeight - b.radius - buffer
      b.velocity.y = b.velocity.y * b.bounce
    }
    if (b.y - b.radius < 0) {
      b.y = b.radius
      b.velocity.y = b.velocity.y * b.bounce
    }
  }


  const spaceOutBlocks = b => {
    settings.blocks.forEach(b2 =>{
      if (b.id === b2.id) return
      const distanceBetweenCapsules = distanceBetween({ a: b, b: b2 })
      if (distanceBetweenCapsules < (b.radius * 2)) {
        b.velocity.multiplyBy(-0.6)
        const overlap = distanceBetweenCapsules - (b.radius * 2)
        b.setXy(
          getNewPosBasedOnTarget({
            start: b,
            target: b2,
            distance: (overlap / 2), 
            fullDistance: distanceBetweenCapsules
          })
        )
      }
    })
  }

  const animateBlock = block => {
    block.accelerate(block.acceleration)
    block.velocity.multiplyBy(block.friction)
    block.addTo(block.velocity)
    setStyles(block)
  }

  const animateBlocks = () => {


    settings.blocks.forEach(block => {
      spaceOutBlocks(block)
      animateBlock(block)
      hitCheckWalls(block)
    })

     // temporal code. updates connector = would need to update by saving connector inside each block?
    settings.blocks[0].line.x = settings.blocks[0].x
    settings.blocks[0].line.y = settings.blocks[0].y
    settings.blocks[0].line.deg = radToDeg(angleTo({ a: settings.blocks[0], b: settings.blocks[1] }))
    settings.blocks[0].line.w = distanceBetween({ a: settings.blocks[0], b: settings.blocks[1] })
    setStyles(settings.blocks[0].line)
  }

  setInterval(()=> {
    animateBlocks()
  }, 30)

  createBlock({ x: 20, y: 20 })
  createBlock({ x: 20, y: 50 })
  addConnector(settings.blocks[0], settings.blocks[1])
}
  
window.addEventListener('DOMContentLoaded', init)


