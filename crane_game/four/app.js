
function init() { 

  // TODO check how pressure softbody works and see if it could be added

  const inputs = {
    k: document.querySelector('.k'),
    friction: document.querySelector('.friction')
  }

  inputs.k.addEventListener('change', e => {
    settings.k = +e.target.value
  })

  inputs.friction.addEventListener('change', e => {
    settings.friction = +e.target.value
  })


  const setStyles = ({ el, x, y, w, deg }) =>{
    if (w) el.style.width =px(w)
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
    flapRotate: 0,
    k: 0.4,
    bounce: -0.2,
    friction: 0.8,
    shapes: [],
    interval: null,
    blockIsLifted: false,
    grabInterval: null
  }

  const blockShape = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ]

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

  const connector = () => Object.assign(document.createElement('div'), { className: 'connector' })


  const createBlock = ({ shape, x, y, data }) => {
    const row = shape[0].length
    const block = {
      ...vector,
      el: Object.assign(document.createElement('div'), { className: `block ${['yellow', 'blue', 'green', 'purple']?.[row * y + x]}`}),
      x: (x * 30) + 100, 
      y: (y * 30) + 100,
      id: row * y + x,
      radius: 15,
    }
    block.velocity = block.create(0, 0)
    block.velocity.setLength(0)
    block.velocity.setAngle(degToRad(90))

    block.acceleration = block.create(0, 1)  
    block.accelerate = function(acceleration) {
      this.velocity.addTo(acceleration)
    }
    if (shape[y - 1]?.[x + 1]) data.lines.push({ start: block, end: row * (y - 1) + x + 1 })
    if (shape[y][x + 1]) data.lines.push({ start: block, end: row * y + x + 1 })
    if (shape?.[y + 1]?.[x]) data.lines.push({ start: block, end: row * (y + 1) + x })
    if (shape?.[y + 1]?.[x + 1]) data.lines.push({ start: block, end: row * (y + 1) + x + 1 })

    setStyles(block)
    elements.machine.append(block.el)
    data.blocks.push(block)
    addTouchAction(block)
  }

  const updateConnectors = line => {
    line.x = line.start.x
    line.y = line.start.y
    line.w = distanceBetween({ a: line.start, b: line.endBlock })
    line.deg = radToDeg(angleTo({ a: line.start, b: line.endBlock })) 
    setStyles(line) 
  }



  const createBlocks = shape => {
    const newShape = {
      blocks: [],
      lines: []
    }
    settings.shapes.push(newShape)
    shape.forEach((row, y) => {
      row.forEach((block, x) => {
        if (block) createBlock({ x, y, shape, data: newShape })
      })
    })
    const topRight = shape[0].length - 1
    const bottomRight = newShape.blocks.length - 1
    const bottomLeft = bottomRight - topRight
    newShape.lines.push({ start: newShape.blocks[0], end: bottomRight })
    newShape.lines.push({ start: newShape.blocks[topRight], end: bottomLeft })

    newShape.lines.push({ start: newShape.blocks[0], end: topRight })
    newShape.lines.push({ start: newShape.blocks[topRight], end: bottomRight })
    newShape.lines.push({ start: newShape.blocks[0], end: bottomLeft })
    newShape.lines.push({ start: newShape.blocks[bottomLeft], end: bottomRight })

    ;[
      {
        index: 0,
        className: 'ear-left'
      },
      {
        index: 2,
        className: 'ear-right'
      },
      {
        index: 6,
        className: 'arm-left'
      },
      {
        index: 8,
        className: 'arm-right'
      },
      {
        index: 9,
        className: 'leg-left'
      },
      {
        index: 11,
        className: 'leg-right'
      },
      {
        index: 1,
        className: 'head'
      },
      {
        index: 4,
        className: 'mouth'
      },
      {
        index: 7,
        className: 'body'
      },
    ].forEach(item => {
      newShape.blocks[item.index].el.classList.add(item.className)
    })

    settings.shapes.forEach(shape => {
      shape.lines.forEach(line => {
        if (!line.endBlock) {
          const endBlock = shape.blocks[line.end]
          line.endBlock = endBlock
        }
        line.length = distanceBetween({ a: line.start, b: line.endBlock }) * 1.1
        line.el = connector()
        elements.machine.appendChild(line.el)
      })
    })
    console.log(shape)
  }


  const addTouchAction = block =>{
    const mousePos = { x: 0, y: 0 }
    const onGrab = e =>{
      mouse.up(document, 'add', onLetGo)
      mouse.move(document, 'add', onDrag)
      mousePos.x = ePos(e, 'X')
      mousePos.y = ePos(e, 'Y')
      clearInterval(settings.grabInterval)
      settings.grabInterval = setInterval(()=> {
        const { left, top } = elements.machine.getBoundingClientRect()
        block.acceleration = block.create((mousePos.x - block.x) - left,  (mousePos.y - block.y) - top) 
      }, 30)
      settings.bounce = 0.2
    }
    const onDrag = e =>{
      mousePos.x = ePos(e, 'X')
      mousePos.y = ePos(e, 'Y')
    }
    const onLetGo = () => {
      mouse.up(document, 'remove', onLetGo)
      mouse.move(document,'remove', onDrag)  
      settings.shapes.forEach(shape => {
        shape.blocks.forEach(b => {
          if (b) b.acceleration = b.create(0, 1)  
        })
      })
      clearInterval(settings.grabInterval)
    }
    settings.bounce = -0.2
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
    const buffer = 0
    if (b.x + b.radius + buffer > machineWidth) {
      b.x = machineWidth - (b.radius + buffer)
      b.velocity.x = b.velocity.x * settings.bounce
    }
    if (b.x - (b.radius + buffer) < 0) {
      b.x = b.radius
      b.velocity.x = b.velocity.x * settings.bounce
    }
    if (b.y + b.radius + buffer > machineHeight) {
      b.y = machineHeight - b.radius - buffer
      b.velocity.y = b.velocity.y * settings.bounce
      // settings.friction = 0.5
    }
    if (b.y - b.radius < 0) {
      b.y = b.radius
      b.velocity.y = b.velocity.y * settings.bounce
      // settings.friction = 0.5
    }
  }


  const spaceOutBlocks = b => {

    settings.shapes.forEach(shape =>{
      // const midPoint = getMidPoint({ a: shape.blocks[0], b: shape.blocks[15] })
      shape.blocks.forEach(b2 => {
        if (b2) {
          if (b.id === b2.id) return
          const distanceBetweenBlocks = distanceBetween({ a: b, b: b2 })
          if (distanceBetweenBlocks < (b.radius * 2)) {
            // b.velocity.multiply(-0.6)
            // todo this needs to be corrected so that the shape get's fixed in the right way
            // todo currently it sets the distance as though blocks are next to each other
            const overlap = distanceBetweenBlocks - (b.radius * 2)
            b.setXy(
              getNewPosBasedOnTarget({
                start: b,
                target: b2,
                distance: (overlap / 2), 
                fullDistance: distanceBetweenBlocks
              })
            )
          }
        }
      })
    })
  }

  const animateBlock = block => {
    block.accelerate(block.acceleration)
    block.velocity.multiplyBy(settings.friction)
    block.addTo(block.velocity)
    setStyles(block)
  }

  const animateBlocks = () => {
    settings.shapes.forEach(shape => {
      const angle = radToDeg(angleTo({ a: shape.blocks[0], b: shape.blocks[4] }))
      shape.blocks.forEach(block => {
        if (block) {
          block.deg = angle - 45
          spaceOutBlocks(block)
          hitCheckWalls(block)
          animateBlock(block)
        }
      })
      shape.lines.forEach(line => {
        const d = line.endBlock.subtract(line.start)
        d.setLength(d.magnitude() - line.length)
        const springForce = d.multiply(settings.k)
        line.start.velocity.addTo(springForce)

        line.endBlock.velocity.addTo(springForce.multiply(-1))
        updateConnectors(line)
      })
    })
  }

  setInterval(animateBlocks, 30)

  createBlocks(blockShape)
  // createBlocks(blockShape)
  // createBlocks(blockShape)

}
  
window.addEventListener('DOMContentLoaded', init)


