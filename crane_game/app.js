
function init() { 

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
    k: 0.4,
    friction: 0.8,
    bounce: -0.2,
    shapes: [],
    interval: null,
    grabInterval: null,
    gravity: 1,
    staticLines: [],
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
    testBtn: document.querySelector('.test-btn')
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
      x: (x * 30) + 100 + ((settings.shapes.length - 1) * 100), 
      y: (y * 30) + 100,
      shapeId: data.id,
      id: `${data.id}-${row * y + x}`,
      radius: 15,
    }
    block.velocity = block.create(0, 0)

    block.acceleration = block.create(0, settings.gravity)  
    block.accelerate = function(acceleration) {
      this.velocity.addTo(acceleration)
    }
    if (shape[y - 1]?.[x + 1]) data.lines.push({ start: block, endIndex: row * (y - 1) + x + 1 })
    if (shape[y][x + 1]) data.lines.push({ start: block, endIndex: row * y + x + 1 })
    if (shape?.[y + 1]?.[x]) data.lines.push({ start: block, endIndex: row * (y + 1) + x })
    if (shape?.[y + 1]?.[x + 1]) data.lines.push({ start: block, endIndex: row * (y + 1) + x + 1 })

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
    const topRight = shape[0].length - 1
    const bottomRight = newShape.blocks.length - 1
    const bottomLeft = bottomRight - topRight
    newShape.lines.push({ start: newShape.blocks[0], endIndex: bottomRight })
    newShape.lines.push({ start: newShape.blocks[topRight], endIndex: bottomLeft })

    newShape.lines.push({ start: newShape.blocks[0], endIndex: topRight })
    newShape.lines.push({ start: newShape.blocks[topRight], endIndex: bottomRight })
    newShape.lines.push({ start: newShape.blocks[0], endIndex: bottomLeft })
    newShape.lines.push({ start: newShape.blocks[bottomLeft], endIndex: bottomRight })

    newShape.frameLines.push({ start: { x: 0, y: 0 }, end: { x: 0, y: 0 } })
    newShape.frameLines.push({ start: { x: 0, y: 0 }, end: { x: 0, y: 0 } })
    newShape.frameLines.push({ start: { x: 0, y: 0 }, end: { x: 0, y: 0 } })
    newShape.frameLines.push({ start: { x: 0, y: 0 }, end: { x: 0, y: 0 } })

    newShape.frameLines.forEach(line => {
      line.el = connector('white')
      elements.machine.appendChild(line.el)
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
      if (!line.end) {
        line.end = newShape.blocks[line.endIndex]
      }
      line.length = distanceBetween({ a: line.start, b: line.end }) * 1.1
      line.el = connector()
      line.id = newShape.id
      elements.machine.appendChild(line.el)
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
      settings.bounce = 0.2
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
    }
    if (b.y - b.radius < 0) {
      b.y = b.radius
      b.velocity.y = b.velocity.y * settings.bounce
    }
  }


  const spaceOutBlocks = b => {
    settings.shapes.forEach(shape =>{
      shape.blocks.forEach(b2 => {
        if (b2) {
          if (b.id === b2.id) return
          const distanceBetweenBlocks = distanceBetween({ a: b, b: b2 })
          if (distanceBetweenBlocks < (b.radius * 2)) {
            // b.velocity.multiplyBy(-0.6)
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

  const spaceOutShapes = b => {
    settings.shapes.forEach(shape => {
      // console.log(b.shapeId, shape.id)
      if (b.shapeId === shape.id) return
      const corners = [
        { index: 0, deg: -45, },
        { index: 2, deg: 45, },
        { index: 11, deg: 135, },
        { index: 9, deg: -135, },
      ].map(item => {
        return getOffsetPos({
          pos: shape.blocks[item.index],
          distance: 30,
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
      // b.velocity.multiplyBy(-0.6)
      if (fullDistance < b.radius) {
        b.velocity.multiplyBy(-0.06)
        const overlap = fullDistance - (b.radius)
        b.setXy(
          getNewPosBasedOnTarget({
            start: b,
            target: closestXy,
            distance: overlap / 2, 
            fullDistance
          })
        )
        b.velocity.multiplyBy(-0.6)
        b.acceleration.y = 0
        // addMarker(      getNewPosBasedOnTarget({
        //   start: b,
        //   target: closestXy,
        //   distance: overlap / 2, 
        //   fullDistance
        // }))
      }
    }
  }

  const hitCheckLines = b => {
    settings.staticLines.forEach(l => hitCheckLine(b, l))
  }

  const animateBlocks = () => {
    settings.shapes.forEach(shape => {
      const angle = radToDeg(angleTo({ a: shape.blocks[1], b: shape.blocks[7] }))
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
          block.deg = angle - 90
          hitCheckLines(block)
          hitCheckWalls(block)
          spaceOutShapes(block)
          spaceOutBlocks(block)
        
          animateBlock(block)
        }
      })

    })


    const corners = [
      { index: 0, deg: -45, },
      { index: 2, deg: 45, },
      { index: 11, deg: 135, },
      { index: 9, deg: -135, },
    ].map(item => {
      return getOffsetPos({
        pos: settings.shapes[0].blocks[item.index],
        distance: 30,
        angle: item.deg + settings.shapes[0].blocks[item.index].deg
      })
    })

    settings.shapes[0].frameLines[0].start = corners[1]
    settings.shapes[0].frameLines[0].end = corners[0]
    updateConnectors(settings.shapes[0].frameLines[0])

    settings.shapes[0].frameLines[1].start = corners[2]
    settings.shapes[0].frameLines[1].end = corners[1]
    updateConnectors(settings.shapes[0].frameLines[1])

    settings.shapes[0].frameLines[2].start = corners[3]
    settings.shapes[0].frameLines[2].end = corners[2]
    updateConnectors(settings.shapes[0].frameLines[2])

    settings.shapes[0].frameLines[3].start = corners[3]
    settings.shapes[0].frameLines[3].end = corners[0]
    updateConnectors(settings.shapes[0].frameLines[3])

  }

  const createLine = ({ start, end }) => {
    const line = {
      el: connector('white'),
      start,
      end,
      id: `static-${settings.staticLines.length}`
    }
    elements.machine.appendChild(line.el)
    settings.staticLines.push(line)
    updateConnectors(line)
  }
  
  // createLine({
  //   start: { x: 50, y: 300 },
  //   end: { x: 300, y: 400 },
  // })

  // createLine({
  //   start: { x: 250, y: 400 },
  //   end: { x: 700, y: 300 },
  // })


  // createLine({
  //   start: { x: 700, y: 300 },
  //   end: { x: 250, y: 400 },
  // })


  // createLine({
  //   start: { x: 280, y: 200 },
  //   end: { x: 300, y: 500 },
  // })



  createBlocks(blockShape)
  console.log(settings.shapes[0])



  setInterval(animateBlocks, 30)



  setTimeout(()=> {
    createBlocks(blockShape)
  }, 3000)


  setTimeout(()=> {
    createBlocks(blockShape)
  }, 4000)
  

  setTimeout(()=> {
    createBlocks(blockShape)
  }, 5000)
  
  setTimeout(()=> {
    createBlocks(blockShape)
  }, 6000)
  

  const addMarker = ({ x, y }) => {
    const marker = {
      el: Object.assign(document.createElement('div'), { className: 'test-marker' }),
      x, y
    }
    elements.machine.appendChild(marker.el)
    setStyles(marker)
  }


  const getOffsetPos = ({ pos, distance, angle }) => {
    return {
      x: pos.x + (distance * Math.cos(degToRad(angle - 90))),
      y: pos.y + (distance * Math.sin(degToRad(angle - 90)))
    }
  }
  


}
  
window.addEventListener('DOMContentLoaded', init)



