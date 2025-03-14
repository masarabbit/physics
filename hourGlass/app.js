
function init() { 

  const px = num => `${num}px`
  const randomNo = (min, max) => min + (Math.floor(Math.random() * (max - min)))

  // const degToRad = deg => deg / (180 / Math.PI)
  // const radToDeg = rad => Math.round(rad * (180 / Math.PI))
  // const ePos = (e, type) => Math.round(e.type[0] === 'm' ? e[`page${type}`] : e.touches[0][`page${type}`])
  

  const settings = {
    friction: 0.3,
    bounce: 0.1,
    shapes: [],
    interval: null,
    gravity: 4,
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
  }

  class WorldObject {
    constructor(props) {
      Object.assign(this, {
        w: 0, h: 0, pos: { x: 0, y: 0 },
        id: settings.objects.length,
        ...props,
      })
      if (this.wrapper) {
        this.el = this.wrapper.querySelector('.box')
      }
      elements.wrapper.appendChild(this.el)
      this.setStyles()
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
      const d1 = this.distanceBetween(line.start)
      const d2 = this.distanceBetween(line.end)
      if (d1 + d2 >= line.length - this.radius && d1 + d2 <= line.length + this.radius) {
        const dot = (((this.pos.x - line.start.x) * (line.end.x - line.start.x)) + ((this.pos.y - line.start.y) * (line.end.y - line.start.y))) / Math.pow(line.length, 2)
        const closestXy = {
          x: line.start.x + (dot * (line.end.x - line.start.x)),
          y: line.start.y + (dot * (line.end.y - line.start.y))
        }
        //  new Marker({ pos: closestXy })
        const fullDistance = this.distanceBetween(closestXy)

        if (fullDistance < this.radius) {
          const overlap = fullDistance - (this.radius)
          this.pos.setXy(
            this.getNewPosBasedOnTarget({
              target: closestXy,
              distance: overlap / 2, 
              fullDistance
            })
          )
          // this.velocity.multiplyXy(1.1)
          // this.acceleration.y = 7
        } 
      }
    }
    spaceOutObjects() {
      settings.objects.forEach(o =>{
        if (this.id === o.id) return
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
        color: '#191919',
        strokeWidth: 2,
        start: { x: 0, y: 0 },
        end: { x: 0, y: 0 },
        ...props,
      })
      this.update()
      elements.svg.appendChild(this.el)
    }
    get length() {
      return Math.sqrt(Math.pow((this.start.x - this.end.x), 2) + Math.pow((this.start.y - this.end.y), 2))
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
          innerHTML: '<div class="box">future</div>'
        }),
        pos: new Vector({ x: props.x, y: props.y }),
        velocity: new Vector({ x: 0, y: 0.1 }),
        acceleration: new Vector({ x: 0, y: settings.gravity }),
        w: 30,
        h: 15,
        radius: 10,
        ...props,
      })
    }
    accelerate() {
      this.velocity.addXy(this.acceleration)
    }
    animateObject() {
      // const originalPos = this.pos
      this.accelerate()
      this.velocity.multiplyXy(settings.friction)

      this.spaceOutObjects()
      settings.lines.forEach(l => {
        this.hitCheckLine(l)
      })
      this.hitCheckWalls()
      this.pos.addXy(this.velocity)
      // if (!this.pos.x || !this.pos.y) {
      //   console.log(originalPos)
      //   this.pos.setXy(originalPos)
      // }
      this.setStyles()

      this.el.innerHTML = this.pos.y < 220
        ? 'future'
        : Math.abs(this.pos.y - 200) < 40
        ? 'now'
        : 'past'
      requestAnimationFrame(()=> this.animateObject())
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
  }

  new Array(40).fill('').map(() => {
    return { x: randomNo(20, 270), y: randomNo(20, 120) }
  }).forEach(b => {
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
  

  settings.objects.forEach(o => requestAnimationFrame(()=> o.animateObject()))


}
  
window.addEventListener('DOMContentLoaded', init)



