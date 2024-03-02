
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
    flapRotate: 0,
    toyColumn: 3,
    toyRow: 3,
    k: 0.2,
    blocks: [],
    interval: null,
    blockIsLifted: false
  }

  const blockShape = [
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
    getLength: function() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
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


  const createBlock = ({ shape, x, y }) => {
    const block = {
      ...vector,
      el: Object.assign(document.createElement('div'), { className: `block ${['yellow', 'blue', 'green', 'purple']?.[id]}`}),
      x: (x * 30) + 100, 
      y: (y * 30) + 100,
      id,
      radius: 10,
      bounce: -0.2,
      friction: 0.9,

      dUp: shape[y - 1]?.[x + 1] ? { 
        el: connector(),
        end: { x: x + 1, y: y - 1 },
      } : null,
      right: shape[y][x + 1] ? { 
        el: connector(),
        end: { x: x + 1, y } 
      } : null,
      down: shape?.[y + 1]?.[x] ? { 
        el: connector(),
        end: { x, y: y + 1 } 
      } : null,
      dDown: shape?.[y + 1]?.[x + 1] ? { 
        el: connector(),
        end: { x: x + 1, y: y + 1 } 
      } : null,
    }
    block.velocity = block.create(0, 0)
    block.velocity.setLength(0)
    block.velocity.setAngle(degToRad(90))

    block.acceleration = block.create(0, 0.5)  
    block.accelerate = function(acceleration) {
      this.velocity.addTo(acceleration)
    }

    setStyles(block)
    elements.machine.append(block.el)
    settings.blocks[y][x] = block
    addTouchAction(block)
    id++
  }

  const updateConnectors = block => {
    ;['dUp', 'right', 'down', 'dDown'].forEach(direction => {
      if (block[direction]) {
        block[direction] = {
          ...block[direction],
          x: block.x,
          y: block.y,
          w: distanceBetween({ a: block, b: block[direction].endBlock }),
          deg: radToDeg(angleTo({ a: block, b: block[direction].endBlock })) 
        }
        setStyles(block[direction]) 
      }
    })
  }

  const createBlocks = shape => {
    settings.blocks = [...shape]
    shape.forEach((row, y) => {
      row.forEach((block, x) => {
        if (block) {
          createBlock({
            x,
            y,
            shape,
          })
        }
      })
    })
    settings.blocks.forEach(row => {
      row.forEach(block => {
        if (block) {
          ;['dUp', 'right', 'down', 'dDown'].forEach(direction => {
            if (block[direction]) {
              const { x, y } = block[direction].end
              const endBlock = settings.blocks[y][x]
              block[direction].endBlock = endBlock
              block[direction].length = distanceBetween({ a: block, b: endBlock }) * 1.2
              elements.machine.appendChild(block[direction].el)
            }
          })
        }
      })
    })
    console.log(settings.blocks)
  }


  const addTouchAction = block =>{
    const onGrab = () =>{
      mouse.up(document, 'add', onLetGo)
      mouse.move(document, 'add', onDrag)
      settings.blocks.forEach(row => {
        row.forEach(b => {
          if (b) {
            b.acceleration = b.create(0, 0)  
          }
        })
      })
      block.acceleration = block.create(0, -0.1) 

    }
    const onDrag = e =>{
      const x = ePos(e, 'X')
      const y = ePos(e, 'Y')
      const { left, top } = elements.machine.getBoundingClientRect()
      block.x = x - left
      block.y = y - top
    }
    const onLetGo = () => {
      mouse.up(document, 'remove', onLetGo)
      mouse.move(document,'remove', onDrag)  
      settings.blocks.forEach(row => {
        row.forEach(b => {
          if (b) {
            b.acceleration = b.create(0, 0.5)  
          }
        })
      })
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
    settings.blocks.forEach( row =>{
      row.forEach(b2 => {
        if (b2) {
          if (b.id === b2.id) return
          const distanceBetweenBlocks = distanceBetween({ a: b, b: b2 })
          if (distanceBetweenBlocks < (b.radius * 2)) {
            b.velocity.multiplyBy(-0.95)
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
    block.velocity.multiplyBy(block.friction)
    block.addTo(block.velocity)
    setStyles(block)
  }

  const animateBlocks = () => {


    settings.blocks.forEach(row => {
      row.forEach(block => {
        if (block) {
          spaceOutBlocks(block)
          hitCheckWalls(block)
          
          ;['dUp', 'right', 'down', 'dDown'].forEach(direction => {
            if (block[direction]) {
              const { endBlock } = block[direction]
              const d = endBlock.subtract(block)
              d.setLength(d.getLength() - block[direction].length)
              const springForce = d.multiply(settings.k)
              block.velocity.addTo(springForce)

              const d2 = block.subtract(endBlock)
              d2.setLength(d2.getLength() - block[direction].length)
              const springForce2 = d2.multiply(settings.k)
              endBlock.velocity.addTo(springForce2)
              
            }
          })
          updateConnectors(block)
          animateBlock(block)
        }
      })
    })
  }

  setInterval(()=> {
    animateBlocks()
  }, 30)

  createBlocks(blockShape)

}
  
window.addEventListener('DOMContentLoaded', init)


