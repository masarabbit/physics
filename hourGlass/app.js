
function init() { 

  const px = num => `${num}px`
  const randomNo = (min, max) => min + (Math.floor(Math.random() * (max - min)))

  // const degToRad = deg => deg / (180 / Math.PI)
  // const radToDeg = rad => Math.round(rad * (180 / Math.PI))
  // const ePos = (e, type) => Math.round(e.type[0] === 'm' ? e[`page${type}`] : e.touches[0][`page${type}`])

  const roundedClient = (e, type) =>
    Math.round(
      e.type[0] === 'm' ? e[`client${type}`] : e.touches[0][`client${type}`],
    )

  const mouse = {
    addEvents(target, event, action, array) {
      array.forEach(a => target[`${event}EventListener`](a, action))
    },
    up(t, e, a) {
      this.addEvents(t, e, a, ['mouseup', 'touchend'])
    },
    move(t, e, a) {
      this.addEvents(t, e, a, ['mousemove', 'touchmove'])
    },
    down(t, e, a) {
      this.addEvents(t, e, a, ['mousedown', 'touchstart'])
    },
    enter(t, e, a) {
      this.addEvents(t, e, a, ['mouseenter', 'touchstart'])
    },
    leave(t, e, a) {
      this.addEvents(t, e, a, ['mouseleave', 'touchmove'])
    },
  }

  

  const settings = {
    friction: 0.3,
    bounce: 0.2,
    shapes: [],
    interval: null,
    gravity: 3,
    lines: [],
    objects: []
  }

  const elements = {
    wrapper: document.querySelector('.wrapper'),
    svg: document.querySelector('svg'),
    indicator: document.querySelector('.indicator'),
    testBtn: document.querySelector('.test-btn'),
  }

  class Vector {
    constructor(props) {
      Object.assign(this, {
        x: 0,
        y: 0,
        ...props,
      })
    }
    // set angle(angle) {
    //   const length = this.magnitude
    //   this.x = Math.cos(angle) * length
    //   this.y = Math.sin(angle) * length
    // }
    // set length(length) {
    //   const angle = Math.atan2(this.y, this.x)
    //   this.x = Math.cos(angle) * length
    //   this.y = Math.sin(angle) * length
    // }
    get magnitude() {
      return Math.sqrt(this.x * this.x + this.y * this.y)
    }
    setXy(xy) {
      this.x = xy.x
      this.y = xy.y
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
    // remove() {
    //   this.wrapper.remove()
    // }
  }

  class WorldObject {
    constructor(props) {
      Object.assign(this, {
        w: 0, h: 0, pos: { x: 0, y: 0 },
        grabPos: { a: { x: 0, y: 0 }, b: { x: 0, y: 0 } },
        id: settings.objects.length,
        ...props,
      })
      if (this.wrapper) {
        this.el = this.wrapper.querySelector('.box')
      }
      elements.wrapper.appendChild(this.el)
      this.defPos = { x: this.pos.x, y: this.pos.y }
      this.setStyles()
      this.addDragEvent()
    }
    setStyles() {
      const { el, pos: { x, y }, w, h } = this
      if (w) el.style.width = px(w)
      if (h) el.style.height = px(h)
      if (this.wrapper) {
        Object.assign(el.style, {
          marginTop: px(h * -0.5),
          marginLeft: px(w * -0.5),
        })
      }
      el.style.transform = `translate(${x ? px(x) : 0}, ${y ? px(y) : 0})`
    }
    distanceBetween(target) {
      return Math.sqrt(Math.pow((this.pos.x - target.x), 2) + Math.pow((this.pos.y - target.y), 2))
    }
    touchPos(e) {
      return {
        x: roundedClient(e, 'X'),
        y: roundedClient(e, 'Y'),
      }
    }
    addDragEvent() {
      mouse.down(this.el, 'add', this.onGrab)
    }
    drag = (e, x, y) => {
      console.log('drag')
      if (e.type[0] === 'm') e.preventDefault()
      this.grabPos.a.x = this.grabPos.b.x - x
      this.grabPos.a.y = this.grabPos.b.y - y
      this.pos.x -= this.grabPos.a.x
      this.pos.y -= this.grabPos.a.y
      this.setStyles()
    }
    onGrab = e => {
      this.grabPos.b = this.touchPos(e)
      mouse.up(document, 'add', this.onLetGo)
      mouse.move(document, 'add', this.onDrag)
    }
    onDrag = e => {
      const { x, y } = this.touchPos(e)
      this.drag(e, x, y)
      this.grabPos.b.x = x
      this.grabPos.b.y = y
    }
    onLetGo = () => {
      mouse.up(document, 'remove', this.onLetGo)
      mouse.move(document, 'remove', this.onDrag)
    }
  }

  class Marker extends WorldObject {
    constructor(props) {
      super({
        el: Object.assign(document.createElement('div'), { 
          className: 'marker'
        }),
        ...props,
      })
    }
  }

  class Line {
    constructor(props) {
      Object.assign(this, {
        el: document.createElementNS('http://www.w3.org/2000/svg','line'),
        color: '#fff',
        strokeWidth: 2,
        start: { x: 0, y: 0 },
        end: { x: 0, y: 0 },
        ...props,
      })
      //* uncomment to see the actual svg line
      // this.update()
      // elements.svg.appendChild(this.el)
    }
    get length() {
      return Math.sqrt(Math.pow((this.start.x - this.end.x), 2) + Math.pow((this.start.y - this.end.y), 2))
    }
    get dx() {
      return this.end.x - this.start.x
    }
    get dy() {
      return this.end.y - this.start.y
    }
    update() {
      const lineStyle = {
        stroke: this.color,
        'stroke-width': this.strokeWidth,
        x1: this.start.x,
        y1: this.start.y,
        x2: this.end.x,
        y2: this.end.y,
      }
      Object.keys(lineStyle).forEach(key => {
        this.el.setAttribute(key, lineStyle[key])
      })
    }
  }

  class GravityObject extends WorldObject {
    constructor(props) {
      super({
        wrapper: Object.assign(document.createElement('div'), { 
          innerHTML: '<div class="box"></div>'
        }),
        pos: new Vector({ x: props.x, y: props.y }),
        velocity: new Vector({ x: 0, y: 0.1 }),
        acceleration: new Vector({ x: 0, y: settings.gravity }),
        w: 30,
        h: 16,
        radius: 10,
        isAtBottom: false,
        isFaded: false,
        ...props,
      })
    }
    accelerate() {
      this.velocity.addXy(this.acceleration)
    }
    hitCheckWalls() {
      const { width, height } = elements.wrapper.getBoundingClientRect()
      const buffer = 0
      if (this.pos.x + this.radius + buffer > width) {
        this.pos.x = width - this.radius
        this.velocity.x *= settings.bounce
      }
      if (this.pos.x - (this.radius + buffer) < 0) {
        this.pos.x = this.radius
        this.velocity.x *= settings.bounce
      } 
      if (this.pos.y + this.radius + buffer > height) {
        this.pos.y = height - this.radius
        this.velocity.y *= settings.bounce
      }
      if (this.pos.y - this.radius < 0) {
        this.pos.y = this.radius
        this.velocity.y *= settings.bounce
      }
    }
    getNewPosBasedOnTarget = ({ target, distance: d, fullDistance }) => {
      const { pos: { x: aX, y: aY } } = this
      const { x: bX, y: bY } = target
      const remainingD = fullDistance - d
      return {
        x: Math.round(((remainingD * aX) + (d * bX)) / fullDistance),
        y: Math.round(((remainingD * aY) + (d * bY)) / fullDistance)
      }
    }
    hitCheckLine(line) {
      // Project point onto the line
      const t = Math.max(0, Math.min(1, ((this.pos.x - line.start.x) * line.dx + (this.pos.y - line.start.y) * line.dy) / Math.pow(line.length, 2)))
      // Compute closest point on line segment
      const closestXy = {
        x: line.start.x + t * line.dx,
        y: line.start.y + t * line.dy
      }
      // Distance from object to closest point
      const fullDistance = this.distanceBetween(closestXy)

      if (fullDistance < this.radius) {
        const overlap = this.radius - fullDistance
        // Normalize the vector
        const normalX = (this.pos.x - closestXy.x) / fullDistance
        const normalY = (this.pos.y - closestXy.y) / fullDistance
        // Push object out of collision
        this.pos.setXy({
          x: this.pos.x + normalX * overlap,
          y: this.pos.y + normalY * overlap
        })
        // revert to closestXy if newPos becomes NaN  
        if (!this.pos.x || !this.pos.y) {
          this.pos.setXy(closestXy)
        }
        // Handle velocity response (e.g., reflection or damping)
        this.velocity.multiplyXy(-0.8)  // Reduce velocity slightly (negative velocity to encourage words to bounce off each other)
        this.velocity.y *= -0.6  // Bounce effect
      }
    }
    spaceOutObjects() {
      settings.objects.forEach(o =>{
        if (this.id === o.id || this.isFaded) return
        const distanceBetweenObjects = this.distanceBetween(o.pos)
        if (distanceBetweenObjects < (this.radius * 2)) {
          // this.velocity.multiplyXy(-0.3)
          const overlap = distanceBetweenObjects - (this.radius * 2)
          this.pos.setXy(
            this.getNewPosBasedOnTarget({
              target: o.pos,
              distance: overlap / 2, 
              fullDistance: distanceBetweenObjects
            })
          )
          // new Marker({ pos: this.pos })
        }
      })
    }
    fadeIn() {
      setTimeout(()=> {
        this.el.className = 'box fade-in'
        this.pos.x = this.defPos.x 
        this.pos.y = 0
        this.isFaded = false
        this.isAtBottom = false
        setTimeout(()=> {
          this.el.classList.remove('fade-in')
        }, 2000)
      }, 1000)
    }
    fadeAndFadeIn() {
      this.el.classList.add('fade-out')
      this.isFaded = true
      this.fadeIn()
    }
    reset() {
      this.el.classList.add('d-none')
      this.isFaded = true
      this.fadeIn()
      console.log('check')
    }
    animateObject() {
      this.spaceOutObjects()
      this.hitCheckWalls()
      settings.lines.forEach(l => this.hitCheckLine(l))
      this.accelerate()
      this.velocity.multiplyXy(settings.friction)
      this.pos.addXy(this.velocity)

      if (!this.pos.x || !this.pos.y) {
        this.reset()
      }
      this.setStyles()

      this.el.className = this.pos.y < 210
        ? 'box future'
        : Math.abs(this.pos.y - 190) < 40
        ? 'box now'
        : 'box past' 

      if (this.pos.y > 430 && !this.isAtBottom) {
        this.isAtBottom = true
        setTimeout(()=> {
          this.fadeAndFadeIn()
        }, 1500)
      }
      requestAnimationFrame(()=> this.animateObject())
    }
  }

  // const timeSeed = [ { x: 144, y: 95 }, { x: 72, y: 95 }, { x: 148, y: 132 }, { x: 108, y: 96 }, { x: 198, y: 184 }, { x: 221, y: 95 }, { x: 229, y: 77 }, { x: 133, y: 184 }, { x: 111, y: 40 }, { x: 145, y: 40 }, { x: 52, y: 131 }, { x: 258, y: 94 }, { x: 76, y: 167 }, { x: 271, y: 57 }, { x: 39, y: 93 }, { x: 234, y: 149 }, { x: 248, y: 130 }, { x: 83, y: 132 }, { x: 184, y: 131 }, { x: 79, y: 114 }, { x: 100, y: 185 }, { x: 169, y: 58 }, { x: 42, y: 40 }, { x: 131, y: 202 }, { x: 251, y: 40 }, { x: 118, y: 77 }, { x: 187, y: 113 }, { x: 130, y: 150 }, { x: 181, y: 40 }, { x: 98, y: 58 }, { x: 220, y: 113 }, { x: 64, y: 149 }, { x: 75, y: 40 }, { x: 64, y: 58 }, { x: 133, y: 58 }, { x: 166, y: 203 }, { x: 42, y: 113 }, { x: 81, y: 77 }, { x: 115, y: 114 }, { x: 115, y: 132 }, { x: 150, y: 114 }, { x: 109, y: 168 }, { x: 263, y: 75 }, { x: 217, y: 131 }, { x: 163, y: 149 }, { x: 218, y: 40 }, { x: 221, y: 168 }, { x: 204, y: 58 }, { x: 166, y: 185 }, { x: 182, y: 95 }, { x: 95, y: 149 }, { x: 198, y: 149 }, { x: 157, y: 77 }, { x: 147, y: 167 }, { x: 239, y: 57 }, { x: 32, y: 58 }, { x: 44, y: 77 }, { x: 193, y: 77 }, { x: 255, y: 112 }, { x: 184, y: 167 } ]
  const timeSeed = [ { x: 93, y: 30 }, { x: 201, y: 30 }, { x: 129, y: 31 }, { x: 166, y: 31 }, { x: 176, y: 47 }, { x: 211, y: 47 }, { x: 73, y: 48 }, { x: 142, y: 48 }, { x: 39, y: 49 }, { x: 108, y: 49 }, { x: 245, y: 49 }, { x: 169, y: 64 }, { x: 133, y: 65 }, { x: 236, y: 65 }, { x: 32, y: 66 }, { x: 67, y: 66 }, { x: 99, y: 66 }, { x: 204, y: 66 }, { x: 268, y: 66 }, { x: 32, y: 84 }, { x: 70, y: 84 }, { x: 104, y: 84 }, { x: 144, y: 84 }, { x: 181, y: 84 }, { x: 223, y: 85 }, { x: 259, y: 85 }, { x: 105, y: 102 }, { x: 141, y: 102 }, { x: 35, y: 103 }, { x: 70, y: 103 }, { x: 179, y: 103 }, { x: 214, y: 103 }, { x: 254, y: 104 }, { x: 78, y: 121 }, { x: 112, y: 121 }, { x: 145, y: 121 }, { x: 180, y: 121 }, { x: 44, y: 122 }, { x: 214, y: 122 }, { x: 250, y: 124 }, { x: 128, y: 140 }, { x: 168, y: 140 }, { x: 56, y: 141 }, { x: 89, y: 141 }, { x: 209, y: 141 }, { x: 244, y: 141 }, { x: 147, y: 158 }, { x: 192, y: 158 }, { x: 231, y: 158 }, { x: 66, y: 159 }, { x: 109, y: 159 }, { x: 115, y: 175 }, { x: 147, y: 175 }, { x: 180, y: 175 }, { x: 215, y: 176 }, { x: 81, y: 177 }, { x: 114, y: 194 }, { x: 147, y: 194 }, { x: 180, y: 195 }, { x: 147, y: 212 } ]
  // const sortedSeed = timeSeed.sort((a, b) => a.x - b.x).sort((a, b) => a.y - b.y)
  // new Array(60).fill('').map(() => {
  //   return { x: randomNo(20, 270), y: randomNo(20, 120) } 
  // })
  timeSeed.forEach(b => {
    settings.objects.push(new GravityObject(b))
  }) 


  ;[
    {
      start: { x: 0, y: 0 },
      end: { x: 10, y: 100 }
    },
    {
      start: { x: 10, y: 100 },
      end: { x: 60, y: 180 }
    },
    {
      start: { x: 60, y: 180 },
      end: { x: 130, y: 220 }
    },
    // waist
    {
      start: { x: 130, y: 220 },
      end: { x: 60, y: 260 }
    },
    {
      start: { x: 60, y: 260 },
      end: { x: 10, y: 340 }
    },
    {
      start: { x: 10, y: 340 },
      end: { x: 0, y: 440 }
    },
    // right
    {
      start: { x: 300, y: 0 },
      end: { x: 290, y: 100 }
    },
    {
      start: { x: 290, y: 100 },
      end: { x: 240, y: 180 }
    },
    {
      start: { x: 240, y: 180 },
      end: { x: 170, y: 220 }
    },
    // waist
    {
      start: { x: 170, y: 220 },
      end: { x: 240, y: 260 }
    },
    {
      start: { x: 240, y: 260 },
      end: { x: 290, y: 340 }
    },
    {
      start: { x: 290, y: 340 },
      end: { x: 300, y: 440 }
    },
  ].forEach(l => settings.lines.push(new Line(l)))
  
  // setInterval(()=> {
  //   settings.objects.forEach(o => o.animateObject())
  // }, 100)
  settings.objects.forEach(o => requestAnimationFrame(()=> o.animateObject()))

  window.addEventListener('keydown', e => {
    if (e.key === ' ') {
      console.log(settings.objects.map(o => {
        return {
          x: o.pos.x,
          y: o.pos.y
        }
      }))
    }
  })
}
  
window.addEventListener('DOMContentLoaded', init)



