
function init() { 

  const body = document.querySelector('body')

  const px = num => `${num}px`

  const degToRad = deg => deg / (180 / Math.PI)
  const radToDeg = rad => Math.round(rad * (180 / Math.PI))
  const angleTo = ({ a, b }) => Math.atan2(b.y - a.y, b.x - a.x)
  const distanceBetween = ({ a, b }) => Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2))


  const ePos = (e, type) => Math.round(e.type[0] === 'm' ? e[`page${type}`] : e.touches[0][`page${type}`])
  

  const settings = {
    friction: 0.3,
    bounce: 0.1,
    shapes: [],
    interval: null,
    gravity: 5,
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

  class Vector {
    constructor(props) {
      Object.assign(this, {
        x: 0,
        y: 0,
        ...props,
      })
    }
    set angle(angle) {
      const length = this.magnitude
      this.x = Math.cos(angle) * length
      this.y = Math.sin(angle) * length
    }
    set length(length) {
      const angle = Math.atan2(this.y, this.x)
      this.x = Math.cos(angle) * length
      this.y = Math.sin(angle) * length
    }
    get magnitude() {
      return Math.sqrt(this.x * this.x + this.y * this.y)
    }
    addXy(xy) {
      this.x += xy.x
      this.y += xy.y
    }
    subtractXy(xy) {
      this.x -= xy.x
      this.y -= xy.y
    }
    multiplyXy(n) {
      this.x *= n
      this.y *= n
    }
  }

  class WorldObject {
    constructor(props) {
      Object.assign(this, {
        w: 0, h: 0, pos: { x: 0, y: 0 },
        ...props,
      })
      body.appendChild(this.el)
      this.setStyles()
    }
    setStyles() {
      const { el, pos: { x, y }, w, h } = this
      if (w) el.style.width = px(w)
      if (h) el.style.height = px(h)
      el.style.transform = `translate(${x ? px(x) : 0}, ${y ? px(y) : 0})`
    }
  }


  class GravityObject extends WorldObject {
    constructor(props) {
      super({
        el: Object.assign(document.createElement('div'), { className: 'box' }),
        pos: new Vector({ x: props.x, y: props.y }),
        velocity: new Vector({ x: 0, y: 0.1 }),
        acceleration: new Vector({ x: 0, y: settings.gravity }),
        w: 40,
        h: 40,
        ...props,
      })
    }
    accelerate() {
      this.velocity.addXy(this.acceleration)
    }
    animateBlock() {
      this.accelerate()
      this.velocity.multiplyXy(settings.friction)
      this.pos.addXy(this.velocity)
      this.setStyles()
      requestAnimationFrame(()=> this.animateBlock())
    }
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

  // const { width: machineWidth, height: machineHeight } = elements.machine.getBoundingClientRect()

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



  const block = new GravityObject({ x: 10, y: 0 })

  // const animateBlocks = () => {
  //   settings.shapes.forEach(shape => { 

  //     shape.blocks.forEach(block => {
  //       if (block) {
  //         animateBlock(block)
  //       }
  //     })
  //   })
  // }



  const newShape = {
    blocks: [],
    lines: [],
    id: `shape-${settings.shapes.length}`,
  }
  settings.shapes.push(newShape)


  // newShape.lines.push({
  //   start: newShape.blocks[0],
  //   end: newShape.blocks[0].grabPoint,
  // })

  // newShape.lines.forEach(line => {
  //   line.length = distanceBetween({ a: line.start, b: line.end }) * 1
  //   line.el = connector()
  //   line.id = newShape.id
  //   elements.machine.appendChild(line.el)
  // })
 
  // setInterval(()=> {
  //   block.animateBlock()
  // }, 20)
  requestAnimationFrame(()=> block.animateBlock())
}
  
window.addEventListener('DOMContentLoaded', init)



