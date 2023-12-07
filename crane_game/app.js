
function init() { 

  const settings = {
    // toyNo: 4,
    flapRotate: 0,
    toyColumn: 2,
    toyRow: 2
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
    multiplyBy: function(n) {
      this.x *= n
      this.y *= n
    },
  }

  const rotatePoint = ({ angle, axis, point }) =>{
    const a = degToRad(angle)
    const aX = point.x - axis.x
    const aY = point.y - axis.y
    return {
      x: (aX * Math.cos(a)) - (aY * Math.sin(a)) + axis.x,
      y: (aX * Math.sin(a)) + (aY * Math.cos(a)) + axis.y,
    }
  }

  const calcX = i => i % settings.toyColumn
  const calcY = i => Math.floor(i / settings.toyColumn)

  const px = num => `${num}px`
  const randomN = max => Math.ceil(Math.random() * max)
  const degToRad = deg => deg / (180 / Math.PI)
  const radToDeg = rad => Math.round(rad * (180 / Math.PI))
  const angleTo = ({ a, b }) => Math.atan2(b.y - a.y, b.x - a.x)
  const distanceBetween = (a, b) => Math.round(Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2)))
  // const getPage = (e, type) => e.type[0] === 'm' ? e[`page${type}`] : e.touches[0][`page${type}`]
  // const calcCollectedX = () => settings.collectedNo % 10 * 32
  // const calcCollectedY = () => Math.floor(settings.collectedNo / 10) * 32
  // const nearest360 = n => n === 0 ? 0 : (n - 1) + Math.abs(((n - 1) % 360) - 360)

  const setStyles = ({ el, x, y, w, h, deg }) =>{
    if (w) el.style.width = px(w)
    if (h) el.style.height = px(h)
    el.style.transform = `translate(${x ? px(x) : 0}, ${y ? px(y) : 0}) rotate(${deg || 0}deg)`
  }

  const lineData = [
    {
      start: { x: 0, y: 280 },
      end: { x: 160, y: 360 },
      point: 'end', 
      axis: 'start',
      id: 'flap_1'
    },
    {
      start: { x: 160, y: 360 },
      end: { x: 320, y: 280, },
      point: 'start', 
      axis: 'end',
      id: 'flap_2'
    },
    {
      start: { x: 70, y: 340 },
      end: { x: 230, y: 490 },
      point: 'start', 
      axis: 'end',
      id: 'ramp'
    }
  ]

  const toys = new Array(settings.toyRow * settings.toyColumn).fill('').map((_, i) => {
    const x = calcX(i) * 40 + 20
    const y = calcY(i) * 40 + 20
    return {
      el: Object.assign(document.createElement('div'), 
        { className: 'mini-toy' }),
      x, y,
      right: calcX(i) + 1 === settings.toyColumn ? null : {
        el: Object.assign(document.createElement('div'), { className: 'connector' }),
        x, y,
        w: 10,
      },
      down: calcY(i) + 1 === settings.toyRow ? null : {
        el: Object.assign(document.createElement('div'), { className: 'connector' }),
        x, y,
        w: 10,
      }
    }
  })

  console.log(toys)
  toys.forEach(toy => {
    setStyles(toy)
    elements.machine.appendChild(toy.el)
    if (toy.right) {
      setStyles(toy.right) 
      elements.machine.appendChild(toy.right.el)
    }
    if (toy.down) {
      setStyles(toy.down)
      elements.machine.appendChild(toy.down.el)
    }
  })


  // new Array(settings.toyNo).fill('').forEach((_, i) => {
  //   const toy = Object.assign(document.createElement('div'), 
  //   { className: 'toy',
  //     innerHTML: `
  //     <div class="capsule-wrapper pix" data-id="${i}">
  //       <div class="capsule"></div>
  //     </div>
  //     <div class="capsule-wrapper pix" data-id="${i}">
  //       <div class="capsule"></div>
  //     </div>
  //     <div class="capsule-wrapper pix" data-id="${i}">
  //       <div class="capsule"></div>
  //     </div>
  //     `
  // })
  //   elements.machine.appendChild(toy)
  // })


  lineData.forEach(() => {
    ;[
      Object.assign(document.createElement('div'), 
        { className: 'line-start', innerHTML: '<div class="line"></div>'}),
      Object.assign(document.createElement('div'), { className: 'line-end' })
    ].forEach(ele => {
      elements.machine.appendChild(ele)
    })
  })

  const lineStarts = document.querySelectorAll('.line-start')
  const lines = document.querySelectorAll('.line')
  const lineEnds = document.querySelectorAll('.line-end')
  const { width: machineWidth, height: machineHeight } = elements.machine.getBoundingClientRect()


  const updateLines = () => {
    lineData.forEach((l, i) => {
      l.length = distanceBetween(l.start, l.end)
      setStyles({ 
        el: lineStarts[i],
        x: l.start.x, 
        y: l.start.y,
        deg: radToDeg(angleTo({
          a: l.start,
          b: l.end
        })) 
      })
      setStyles({ el: lines[i], w: px(l.length) })
      setStyles({ el: lineEnds[i], x: l.end.x, y: l.end.y })
    })
  }

  const capsuleData = Array.from(document.querySelectorAll('.capsule-wrapper')).map((c, i) => {
    const data = {
      ...vector,
      el: c,
      id: i,
      deg: 0,
      radius: 16, // actual radius should be 32, but setting it higher
      bounce: -0.5, // this reduces the velocity gradually
      friction: 0.99,
    }

    data.velocity = data.create(0, 1)  //? velocity is another vector
    data.velocity.setLength(10)
    data.velocity.setAngle(degToRad(90))
    data.setXy({
      x: randomN(machineWidth - 32), 
      // y: randomN(machineHeight - 250), 
      y: 0
    })

    // gravity
    data.acceleration = data.create(0, 4)  
    // data.acceleration.setAngle(degToRad(270))
    data.accelerate = function(acceleration) {
      this.velocity.addTo(acceleration)
    }
    return data
  })

  const getNewPosBasedOnTarget = ({ start, target, distance: d, fullDistance }) => {
    const { x: aX, y: aY } = start
    const { x: bX, y: bY } = target
    const remainingD = fullDistance - d
    return {
      x: Math.round(((remainingD * aX) + (d * bX)) / fullDistance),
      y: Math.round(((remainingD * aY) + (d * bY)) / fullDistance)
    }
  }


  const rotateLines = angles => {
    angles.forEach((angle, i) => {
      const { axis, point } = lineData[i]
      lineData[i][point] = rotatePoint({ 
        angle,
        axis: lineData[i][axis],
        point: lineData[i][point]
      })
    })
  }

  const openFlap = () => {
    if (settings.flapRotate > -20) {
      settings.flapRotate-= 2
      rotateLines([ 2, -2, -4 ])
      updateLines()
      setTimeout(openFlap, 30)
    } else {
      setTimeout(closeFlap, 800)
    }
  }


  const closeFlap = () => {
    if (settings.flapRotate < 0) {
      settings.flapRotate+= 1
      if (settings.flapRotate === 0) {
        [
          { x: 160, y: 360 },
          { x: 160, y: 360 },
          { x: 70, y: 340 },
        ].forEach((item, i) => {
          lineData[i][lineData[i].point].x = item.x
          lineData[i][lineData[i].point].y = item.y
        })
        settings.isHandleLocked = false
      } else {
        rotateLines([ -1, 1, 2 ])
      }
      updateLines()
      setTimeout(closeFlap, 30)
    }
  }


  // const spaceOutCapsules = c => {
  //   capsuleData.forEach(c2 =>{
  //     // console.log('test', c.el.dataset.id )
  //     if (c.id === c2.id || c2.selected) return
  //     const distanceBetweenCapsules = distanceBetween(c, c2)
  //     const overlap = distanceBetweenCapsules - (c.radius * 2)

  //     // if (c.el.dataset.id === c2.el.dataset.id && distanceBetweenCapsules < (c.radius * 2)) {
  //     //   c.setXy(
  //     //     getNewPosBasedOnTarget({
  //     //       start: c,
  //     //       target: c2,
  //     //       distance: 32, 
  //     //       fullDistance: distanceBetweenCapsules
  //     //     })
  //     //   )
  //     // } else 
  //     if (distanceBetweenCapsules < (c.radius * 2)) {
  //         c.velocity.multiplyBy(-0.6)
  //         c.setXy(
  //           getNewPosBasedOnTarget({
  //             start: c,
  //             target: c2,
  //             distance: overlap / 2, 
  //             fullDistance: distanceBetweenCapsules
  //           })
  //         )
  //       }
  //   })
  // }

  const spaceOutCapsules = c => {
    capsuleData.forEach(c2 =>{
      if (c.id === c2.id || c2.selected) return
      const distanceBetweenCapsules = distanceBetween(c, c2)
      if (distanceBetweenCapsules < (c.radius * 2)) {
        c.velocity.multiplyBy(-0.6)
        const overlap = distanceBetweenCapsules - (c.radius * 2)
        c.setXy(
          getNewPosBasedOnTarget({
            start: c,
            target: c2,
            distance: overlap / 2, 
            fullDistance: distanceBetweenCapsules
          })
        )
      }
    })
  }

  const hitCheckLines = c => {
    lineData.forEach(l => {
      // this only works when velocity is from above
      if ((c.x + c.radius > l.start.x) && (c.x - c.radius < l.end.x)) {
        const dot = (((c.x - l.start.x) * (l.end.x - l.start.x)) + ((c.y - l.start.y) * (l.end.y - l.start.y))) / Math.pow(l.length, 2)
        const closestXy = {
          x: l.start.x + (dot * (l.end.x - l.start.x)),
          y: l.start.y + (dot * (l.end.y - l.start.y))
        }
        const fullDistance = distanceBetween(c, closestXy)

        if (fullDistance < c.radius) {
          c.velocity.multiplyBy(-0.6)
          const overlap = fullDistance - (c.radius)
          c.setXy(
            getNewPosBasedOnTarget({
              start: c,
              target: closestXy,
              distance: overlap / 2, 
              fullDistance
            })
          )
        }
      }
    })
  }

  const hitCheckMachineWalls = c => {
    const buffer = 5
    if (c.x + c.radius + buffer > machineWidth) {
      c.x = machineWidth - (c.radius + buffer)
      c.velocity.x = c.velocity.x * c.bounce
    }
    if (c.x - (c.radius + buffer) < 0) {
      c.x = c.radius
      c.velocity.x = c.velocity.x * c.bounce
    }
    if (c.y + c.radius + buffer > machineHeight) {
      c.y = machineHeight - c.radius - buffer
      c.velocity.y = c.velocity.y * c.bounce
    }
    if (c.y - c.radius < 0) {
      c.y = c.radius
      c.velocity.y = c.velocity.y * c.bounce
    }
  }


  const animateCapsules = () => {
    capsuleData.forEach((c, i) => {
      if (c.selected) return
      c.prevX = c.x
      c.prevY = c.y

      c.accelerate(c.acceleration)
      c.velocity.multiplyBy(c.friction)
      c.addTo(c.velocity)

      spaceOutCapsules(c)
      hitCheckLines(c)
      hitCheckMachineWalls(c)

      if (Math.abs(c.prevX - c.x) < 2 && Math.abs(c.prevY - c.y) < 2) {
        c.velocity.setXy({ x: 0, y: 0 })
        c.setXy({ x: c.prevX, y: c.prevY })
      } else {
        if (Math.abs(c.prevX - c.x)) {
          // rotate capsule
          c.deg += (c.x - c.prevX) * 2
        }
      }
      setStyles(capsuleData[i])
    })
  }



  updateLines()
  // setInterval(animateCapsules, 100)
  // setInterval(animateCapsules, 30)

}
  
window.addEventListener('DOMContentLoaded', init)

