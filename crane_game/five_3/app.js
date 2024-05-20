
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
    k: 0.42,
    friction: 0.46,
    bounce: 0.1,
    shapes: [],
    interval: null,
    grabInterval: null,
    gravity: 4,
    staticLines: [],
    grabbedBlock: null
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


  const createBlock = ({ shape, x, y, data }) => {
    const row = shape[0].length
    const block = {
      ...vector,
      el: Object.assign(document.createElement('div'), 
        { className: `block ${['yellow', 'blue', 'green', 'purple']?.[row * y + x]}` }),
      x: (x * 15) + 100 + ((settings.shapes.length - 1) * 100), 
      y: (y * 15) + 100,
      shapeId: data.id,
      id: `${data.id}-${row * y + x}`,
      radius: 15,
    }
    block.velocity = block.create(0, 0)

    block.acceleration = block.create(0, settings.gravity)  
    block.accelerate = function(acceleration) {
      this.velocity.addTo(acceleration)
    }

    setStyles(block)
    elements.machine.append(block.el)
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



  const createBlocks = shape => {
    const newShape = {
      blocks: [],
      lines: [],
      id: `shape-${settings.shapes.length}`,
      frameLines: [],
    }
    settings.shapes.push(newShape)
    shape.forEach((row, y) => {
      row.forEach((block, x) => {
        if (block) createBlock({ x, y, shape, data: newShape })
      })
    })

    newShape.blocks.forEach((b, i) => {
      newShape.blocks.forEach((b2, i2) => {
        if (i2 > i) newShape.lines.push({ start: b, end: b2})
      })
    })
    
    ;[
      { index: 0, className: 'ear-left' },
      { index: 1, className: 'head' },
      { index: 2, className: 'ear-right' },
      { index: 4, className: 'mouth' },
      { index: 6, className: 'arm-left' },
      { index: 7, className: 'body' },
      { index: 8, className: 'arm-right' },
      { index: 9, className: 'leg-left' },
      { index: 11, className: 'leg-right' },
    ].forEach(item => {
      newShape.blocks[item.index].el.classList.add(item.className)
    })

    newShape.lines.forEach(line => {
      line.length = distanceBetween({ a: line.start, b: line.end }) * 1
      line.el = connector()
      line.id = newShape.id
      elements.machine.appendChild(line.el)
    })
  }

  const addTouchAction = block =>{
    const mousePos = { x: 0, y: 0 }
    const onGrab = e =>{
      // console.log('test', e)
      mouse.up(document, 'add', onLetGo)
      mouse.move(document, 'add', onDrag)
      mousePos.x = ePos(e, 'X')
      mousePos.y = ePos(e, 'Y')
      settings.shapes.forEach(shape => {
        shape.blocks.forEach(b => {
          if (b) b.acceleration = b.create(0, settings.gravity)  
        })
      })
      clearInterval(settings.grabInterval)
      settings.grabInterval = setInterval(()=> {
        const { left, top } = elements.machine.getBoundingClientRect()
        block.acceleration = block.create(
          (mousePos.x - block.x) - left,
          (mousePos.y - block.y) - top
        ) 
      }, 30)
      settings.bounce = 0.1
    }
    const onDrag = e =>{
      mousePos.x = ePos(e, 'X')
      mousePos.y = ePos(e, 'Y')
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
      b.x = machineWidth - (b.radius + buffer)
      b.velocity.x *= settings.bounce
    }
    if (b.x - (b.radius + buffer) < 0) {
      b.x = b.radius
      b.velocity.x *= settings.bounce
    } 
    if (b.y + b.radius + buffer > machineHeight) {
      b.y = machineHeight - b.radius - buffer
      b.velocity.y *= settings.bounce
      b.onGround = true
    } else {
      b.onGround = false
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

  const spaceOutShapes = b => {
    settings.shapes.forEach(shape => {
      if (b.shapeId === shape.id || !shape.blocks.some(b2 => b2.onGround || b2.inContact)) return

      const corners = [
        { index: 0, deg: -45, },
        { index: 2, deg: 45, },
        { index: 11, deg: 135, },
        { index: 9, deg: -135, },
      ].map(item => {
        return getOffsetPos({
          pos: shape.blocks[item.index],
          distance: 10,
          angle: item.deg + shape.blocks[item.index].deg
        })
      })

      ;[
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0]
      ].forEach(index => {
        hitCheckLine(b, {
          start: corners[index[0]],
          end: corners[index[1]],
        })
      })
    })
  }


  const hitCheckLine = (b, l) => {
    const lineWidth = l.w || distanceBetween({ a: l.start, b: l.end })

    const d1 = distanceBetween({ a: b, b: l.start })
    const d2 = distanceBetween({ a: b, b: l.end })
    if (d1 + d2 >= lineWidth - b.radius && d1 + d2 <= lineWidth + b.radius) {
      const dot = (((b.x - l.start.x) * (l.end.x - l.start.x)) + ((b.y - l.start.y) * (l.end.y - l.start.y))) / Math.pow(lineWidth, 2)
      const closestXy = {
        x: l.start.x + (dot * (l.end.x - l.start.x)),
        y: l.start.y + (dot * (l.end.y - l.start.y))
      }
      const fullDistance = distanceBetween({ a: b, b: closestXy })
      if (fullDistance < b.radius) {
        b.inContact = true
        const overlap = fullDistance - (b.radius)
        b.setXy(
          getNewPosBasedOnTarget({
            start: b,
            target: closestXy,
            distance: overlap / 2, 
            fullDistance
          })
        )
        b.velocity.multiplyBy(0.1)
        b.acceleration.y = 0.5
      } else {
        b.inContact = false
      }
    }
  }


  const getAngle = shape => {
    const averageX = shape.blocks.reduce((a, c) => a + c.x, 0) / (shape.blocks.length)
    const averageY = shape.blocks.reduce((a, c) => a + c.y, 0) / (shape.blocks.length)

    const averagePoint = {
      x: averageX,
      y: averageY
    }
    // this doesn't get total angle...
    // const totalAngles = shape.blocks.reduce((a, b) => {
    //   const angle = radToDeg(angleTo({ a: averagePoint, b }))
    //   return a + angle
    // }, 0)
    // return totalAngles
    return radToDeg(angleTo({ a: shape.blocks[1], b: averagePoint }))
  }


  const animateBlocks = () => {
    settings.shapes.forEach(shape => { 
      const angle = getAngle(shape) - 90
      shape.lines.forEach(line => {
        const d = line.end.subtract(line.start)
        d.setLength(d.magnitude() - line.length)
        const springForce = d.multiply(settings.k)
        line.start.velocity.addTo(springForce)
        line.end.velocity.addTo(springForce.multiply(-1))
        updateConnectors(line)
      })
      shape.blocks.forEach(block => {
        if (block) {
          block.deg = Math.round(angle)
          hitCheckWalls(block)
          if (settings.grabbedBlock) {
            if (!settings.shapes.find(shape => shape.id === settings.grabbedBlock.shapeId).blocks.some(b => b.id === block.id)) spaceOutShapes(block)    
          } else {
            spaceOutShapes(block)    
          }  
          animateBlock(block)
        }
      })
    })
  }

  // const createLine = ({ start, end }) => {
  //   const line = {
  //     el: connector('white'),
  //     start,
  //     end,
  //     id: `static-${settings.staticLines.length}`
  //   }
  //   elements.machine.appendChild(line.el)
  //   settings.staticLines.push(line)
  //   updateConnectors(line)
  // }
  createBlocks(blockShape)
  createBlocks(blockShape)
  createBlocks(blockShape)
  createBlocks(blockShape)

  // const addMarker = ({ x, y }) => {
  //   const marker = {
  //     el: Object.assign(document.createElement('div'), { className: 'test-marker' }),
  //     x, y
  //   }
  //   elements.machine.appendChild(marker.el)
  //   setStyles(marker)
  // }


  const getOffsetPos = ({ pos, distance, angle }) => {
    return {
      x: pos.x + (distance * Math.cos(degToRad(angle - 90))),
      y: pos.y + (distance * Math.sin(degToRad(angle - 90)))
    }
  }

  const triggerVerticalArmMovement = () => {
    elements.machineArm.motion = 'vertical'
    elements.machineArm.arm.el.classList.add('open')
    setTimeout(moveMachineArmVertically, 200)
  }

  const moveMachineArmHorizontally = () => {
    if (elements.machineArm.motion === 'horizontal') {
      if (elements.machineArm.x >= (elements.machine.offsetWidth - elements.machineArm.el.offsetWidth)) {
        triggerVerticalArmMovement()
      } else {
        elements.machineArm.x += 10
        setStyles(elements.machineArm)
        setTimeout(()=> {
          moveMachineArmHorizontally()
        }, 100)
      }
    }
  }

  const moveMachineArmVertically = () => {
    if (elements.machineArm.motion === 'vertical') {
      const hasHitBottomLimit = elements.machineArm.y >= (elements.machine.offsetHeight - elements.machineArm.el.offsetHeight)
      const nearestPoint = getClosestPoint({
        x: elements.machineArm.x + 15,
        y: elements.machineArm.y + 30
      })
      if (hasHitBottomLimit || nearestPoint?.dist < 30) {
        elements.machineArm.motion = 'stop-vertical'
        grab(nearestPoint)
        setTimeout(()=> {
          returnArm()
        }, 800)
      } else {
        elements.machineArm.y += 20
        setStyles(elements.machineArm)

        elements.machineArm.arm.y = -elements.machineArm.y
        elements.machineArm.arm.h += 20
        setStyles(elements.machineArm.arm)
        setTimeout(()=> {
          moveMachineArmVertically()
        }, 100)
      }
    }
  }

  const getClosestPoint = point => {
    return settings.shapes.map(shape => {
      return shape.blocks.map((block, i) => {
        // if (i === 4) return
        return {
          dist: distanceBetween({ a: block, b: point}),
          shapeId: block.shapeId,
          blockId: block.id
        }
      })
    }).flat(1).sort((a, b) => {
      return a.dist - b.dist
    })[0]
  } 

  const grab = point => {
    const grabbedShape = settings.shapes.find(shape => shape.id === point.shapeId)
    const blockToGrab = grabbedShape.blocks.find(block => block.id === point.blockId)
    settings.grabbedBlock = blockToGrab

    settings.shapes.forEach(shape => {
      shape.blocks.forEach(b => {
        if (b) {
          const gravity = point.shapeId === shape.id ? 0.5 : settings.gravity
          b.acceleration = b.create(0, gravity)  
        }
      })
    })
    clearInterval(settings.grabInterval)
    settings.grabInterval = setInterval(()=> {
      blockToGrab.acceleration = blockToGrab.create(
        ((elements.machineArm.x + 15) - blockToGrab.x),
        ((elements.machineArm.y + 30) - blockToGrab.y)
      ) 
    }, 30)
    settings.bounce = 0.1
  }

  const returnArm = () => {
    elements.machineArm.arm.el.classList.remove('open')
    if (elements.machineArm.y > 0) {
      elements.machineArm.y -= 10
      setStyles(elements.machineArm)
  
      elements.machineArm.arm.y = -elements.machineArm.y
      elements.machineArm.arm.h -= 10
      setStyles(elements.machineArm.arm)
      setTimeout(()=> {
        returnArm()
      }, 50)
    } else if (elements.machineArm.x > 0) {
      elements.machineArm.x -= 10
      setStyles(elements.machineArm)
      setTimeout(()=> {
        returnArm()
      }, 50)
    } else {
      console.log('release')
      elements.machineArm.arm.el.classList.add('open')
      setTimeout(()=> {
        if (settings.grabbedBlock) {
          settings.shapes.find(b => b.id === settings.grabbedBlock.shapeId).blocks.forEach(b => {
            if (b) b.acceleration = b.create(0, settings.gravity)  
          })
          clearInterval(settings.grabInterval)
          settings.grabbedBlock = null
        }
      }, 200)
      setTimeout(()=> {
        elements.machineArm.arm.el.classList.remove('open')
      }, 500)
    
      elements.machineArm.motion = null
    }
  }
  
  elements.testBtn.addEventListener('click', ()=> {
    if (!elements.machineArm.motion) {
      elements.machineArm.motion = 'horizontal'
      moveMachineArmHorizontally()
      } else if ( elements.machineArm.motion === 'horizontal') {
        triggerVerticalArmMovement()
      } else if ( elements.machineArm.motion === 'vertical') {
        elements.machineArm.motion = 'stop-vertical'
        grab({
          x: elements.machineArm.x + 15,
          y: elements.machineArm.y + 30
        })
        setTimeout(()=> {
          returnArm()
        }, 800)
      }
  })

  setInterval(animateBlocks, 30)
}
  
window.addEventListener('DOMContentLoaded', init)



