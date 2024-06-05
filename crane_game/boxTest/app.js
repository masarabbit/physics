
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
    friction: 0.3,
    bounce: 0.1,
    shapes: [],
    interval: null,
    grabInterval: null,
    gravity: 5,
    grabbedBlock: null
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

  const connector = plus => Object.assign(document.createElement('div'), { className: `connector${plus ? ` ${plus}` : ''}` })

  const axis = {
    // el: document.querySelector('.axis'),
    x: 0,
    y: 0,
    // ...vector 
  }

  // axis.velocity = axis.create(0, 0)

  // axis.acceleration = axis.create(0, settings.gravity)  
  // axis.accelerate = function(acceleration) {
  //   this.velocity.addTo(acceleration)
  // }




  const createBlock = ({ x, y, data, index }) => {
    // const row = shape[0].length
    const block = {
      ...vector,
      el: Object.assign(document.createElement('div'), 
      { 
        className: 'box',
        innerHTML: `
          <div class="marker top-left"></div>
          <div class="marker top-right"></div>
          <div class="border"></div>
          <div class="marker bottom-left"></div>
          <div class="marker bottom-right"></div>
          <div class="axis">
        `
      }),
      x, 
      y,
      shapeId: data.id,
      id: `${data.id}-${index}`,
      radius: 50
      // radius: radius || 15,
    }
    block.velocity = block.create(0, 0)

    block.wrapper = Object.assign(document.createElement('div'), 
      { className: 'box-wrapper' })

    block.acceleration = block.create(0, settings.gravity)  
    block.accelerate = function(acceleration) {
      this.velocity.addTo(acceleration)
    }


    block.grabPoint = {
      ...vector,
      el: Object.assign(document.createElement('div'), { 
        className: 'grab-point',
      }),
      x,
      y: y - 50,
    }
    setStyles(block.grabPoint)

    // block.deg = radToDeg(angleTo({ a: block, b: block.grabPoint }))
    setStyles(block)

    // block.el.style.setProperty('--radius', `${radius || 15}px`)
    // elements.machine.append(block.wrapper)
    // block.wrapper.append(block.el)

    elements.machine.append(block.el)
    elements.machine.append(block.grabPoint.el)

    block.grabPoint.velocity = block.grabPoint.create(0, 0)
    block.grabPoint.acceleration = block.grabPoint.create(0, settings.gravity)  
    block.grabPoint.accelerate = function(acceleration) {
      this.velocity.addTo(acceleration)
    }

    data.blocks.push(block)
    addTouchAction(block)
  }


  const updateConnectors = line => {
    line.x = line.start.x
    line.y = line.start.y
    line.w = distanceBetween({ a: line.start, b: line.end })
    line.deg = radToDeg(angleTo({ a: line.start, b: line.end })) 
    setStyles(line) 
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
        block.grabPoint.x = mousePos.x - left
        block.grabPoint.y = mousePos.y - top
        setStyles(block.grabPoint)
      
      }, 100)
      // settings.bounce = 0.1
    }
    const onDrag = e =>{
      mousePos.x = ePos(e, 'X')
      mousePos.y = ePos(e, 'Y')
      setStyles(block.grabPoint)
    }
    const onLetGo = () => {
      mouse.up(document, 'remove', onLetGo)
      mouse.move(document,'remove', onDrag)  
      settings.shapes.find(b => b.id === block.shapeId).blocks.forEach(b => {
        if (b) b.acceleration = b.create(0, settings.gravity)  
      })
      clearInterval(settings.grabInterval)
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
    const buffer = 0
    if (b.x + b.radius + buffer > machineWidth) {
      b.x = machineWidth - b.radius
      b.velocity.x *= settings.bounce
    }
    if (b.x - (b.radius + buffer) < 0) {
      b.x = b.radius
      b.velocity.x *= settings.bounce
    } 
    if (b.y + b.radius + buffer > machineHeight) {
      b.y = machineHeight - b.radius
      b.velocity.y *= settings.bounce
    }
    if (b.y - b.radius < 0) {
      b.y = b.radius
      b.velocity.y *= settings.bounce
    }
  }

  const animateBlock = block => {
    block.accelerate(block.acceleration)
    block.velocity.multiplyBy(settings.friction)
    block.addTo(block.velocity)
    setStyles(block)
  }


  const animateBlocks = () => {
    settings.shapes.forEach(shape => { 

      shape.blocks.forEach(block => {
        if (block) {
          setStyles(axis)

          newShape.lines.forEach(line => {
            shape.lines.forEach(line => {
              const d = line.end.subtract(line.start)
              d.setLength(d.magnitude() - line.length)
              const springForce = d.multiply(settings.k)
              line.start.velocity.addTo(springForce)
              line.end.velocity.addTo(springForce.multiply(-1))
              updateConnectors(line)
            })
            updateConnectors(line)
          })
          // block.wrapper.transformOrigin = `${axis.x}px ${axis.y}px`
          // block.el.style.marginTop = `-${axis.y}px`
          // block.el.style.marginLeft = `-${axis.x}px`
          // block.wrapper.style.rotate = `${radToDeg(angleTo({ a: block, b: block.grabPoint }))}deg`
          axis.x = block.grabPoint.x - block.x
          axis.y = block.grabPoint.y - block.y
          // block.deg = radToDeg(angleTo({ a: block, b: block.grabPoint }))
          setStyles(axis)

          animateBlock(block)
          animateBlock(block.grabPoint)
          // animateBlock(axis)
        }
      })
    })
  }



  const newShape = {
    blocks: [],
    lines: [],
    id: `shape-${settings.shapes.length}`,
  }
  settings.shapes.push(newShape)

  createBlock({
    x: 150,
    y: 50,
    data: newShape,
    id: 1,
    index: 0
  })

  newShape.lines.push({
    start: newShape.blocks[0],
    end: newShape.blocks[0].grabPoint,
  })

  newShape.lines.forEach(line => {
    line.length = distanceBetween({ a: line.start, b: line.end }) * 1
    line.el = connector()
    line.id = newShape.id
    elements.machine.appendChild(line.el)
  })


  axis.el = document.querySelector('.axis')
  setInterval(animateBlocks, 50)
}
  
window.addEventListener('DOMContentLoaded', init)



