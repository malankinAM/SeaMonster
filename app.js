window.onload = function () {
    let ctx = document.getElementById("C"),
      c = ctx.getContext("2d"),
      w,
      h;
    fitCanvas();
  
    function limit(vec, b) {
      this.d = Math.sqrt(Math.pow(vec.x, 2) + Math.pow(vec.y, 2));
      this.ang = Math.atan2(vec.y, vec.x);
      if (this.d > b) {
        return {
          x: b * Math.cos(this.ang),
          y: b * Math.sin(this.ang)
        };
      } else {
        return {
          x: this.d * Math.cos(this.ang),
          y: this.d * Math.sin(this.ang)
        };
      }
    }
    function setmag(a, m) {
      this.ang = Math.atan2(a.y, a.x);
      return {
        x: m * Math.cos(this.ang),
        y: m * Math.sin(this.ang)
      };
    }
  
    let mouse = { x: false, y: false },
      last_mouse = {},
      pi = Math.PI,
      seaMargin = 1000,
      boids = new Array(100);
  
    class boid {
      constructor() {
        this.opacity = Math.random() * 0.5 + 0.05;
        this.ang = Math.random() * 2 * Math.PI;
        this.mf = 0.1;
        this.ms = Math.random() * 0.1 + 0.9;
        this.vm = Math.random() * 1 + 0.5;
        this.pos = {
          x: Math.random() * w,
          y: Math.random() * h
        };
        this.vel = {
          x: this.vm * Math.cos(this.ang),
          y: this.vm * Math.sin(this.ang)
        };
        this.acc = {
          x: 0,
          y: 0
        };
      }
      flock(other) {
        this.aa = {
          x: 0,
          y: 0
        };
        this.ap = {
          x: 0,
          y: 0
        };
        this.as = {
          x: 0,
          y: 0
        };
        this.count = 0;
        for (var ot of other) {
          if (ot != this) {
            this.dis = Math.sqrt(
              Math.pow(ot.pos.x - this.pos.x, 2) +
                Math.pow(ot.pos.y - this.pos.y, 2)
            );
            if (this.dis < 40) {
              this.aa.x += ot.vel.x;
              this.aa.y += ot.vel.y;
              this.ap.x += ot.pos.x;
              this.ap.y += ot.pos.y;
              this.as.x += this.pos.x - ot.pos.x;
              this.as.y += this.pos.y - ot.pos.y;
              this.count++;
            }
          }
        }
        if (this.count != 0) {
          this.aa.x /= this.count;
          this.aa.y /= this.count;
          this.ap.x /= this.count;
          this.ap.y /= this.count;
          this.as.x /= this.count;
          this.as.y /= this.count;
  
          this.as = setmag(
            this.as,
            4 / Math.sqrt(Math.pow(this.as.x, 2) + Math.pow(this.as.y, 2))
          );
  
          this.aa.x -= this.vel.x;
          this.aa.y -= this.vel.y;
          this.ap.x -= this.vel.x;
          this.ap.y -= this.vel.y;
        }
  
        this.aa = limit(this.aa, this.mf);
        this.ap = limit(this.ap, this.mf);
        this.as = limit(this.as, 4 * this.mf);
      }
      move() {
        this.acc = {
          x: 0,
          y: 0
        };
  
        this.acc.x += this.aa.x;
        this.acc.y += this.aa.y;
        this.acc.x += this.ap.x;
        this.acc.y += this.ap.y;
        this.acc.x += this.as.x;
        this.acc.y += this.as.y;
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        this.vel.x += this.acc.x;
        this.vel.y += this.acc.y;
  
        this.vel = limit(this.vel, this.ms);
        this.ang = Math.atan2(this.vel.y, this.vel.x);
  
        if (this.pos.x > w + seaMargin) {
          this.pos.x -= w + seaMargin;
        }
        if (this.pos.x < -seaMargin) {
          this.pos.x += w + seaMargin;
        }
        if (this.pos.y > h + seaMargin) {
          this.pos.y -= h + seaMargin;
        }
        if (this.pos.y < -seaMargin) {
          this.pos.y += h + seaMargin;
        }
      }
      show() {
        c.beginPath();
        c.lineTo(
          this.pos.x - this.opacity * 20 * Math.cos(this.ang),
          this.pos.y - this.opacity * 20 * Math.sin(this.ang)
        );
        c.lineTo(
          this.pos.x + this.opacity * 20 * Math.cos(this.ang),
          this.pos.y + this.opacity * 20 * Math.sin(this.ang)
        );
        c.strokeStyle = "rgba(255,255,255," + this.opacity + ")";
        c.lineWidth = this.opacity * 8;
        c.lineCap = "round";
        c.stroke();
      }
    }
  
    class node {
      constructor(x, y, size, index, length) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.angle = Math.random() * 2 * Math.PI;
        this.nx = this.x + size * 2 * Math.cos(this.angle);
        this.ny = this.y + size * 2 * Math.sin(this.angle);
        this.i = index;
        this.l = length;
      }
      follow(m) {
        this.errx = m.x - this.x;
        this.erry = m.y - this.y;
        this.td = Math.sqrt(Math.pow(this.errx, 2) + Math.pow(this.erry, 2));
        this.ta = Math.atan2(this.erry, this.errx);
        this.x = this.x + this.td * 0.2 * Math.cos(this.ta);
        this.y = this.y + this.td * 0.2 * Math.sin(this.ta);
      }
      update(other, r) {
        this.errx = other.x - this.x;
        this.erry = other.y - this.y;
        this.a = Math.atan2(this.erry, this.errx);
        this.nx = this.x + r * Math.cos(this.a);
        this.ny = this.y + r * Math.sin(this.a);
      }
      avoid(other, rad) {
        this.d = Math.sqrt(
          Math.pow(other.x - this.x, 2) + Math.pow(other.y - this.y, 2)
        );
        this.ang = Math.atan2(other.y - this.y, other.x - this.x);
        if (this.d <= rad) {
          this.x = this.x - 1 * Math.cos(this.ang);
          this.y = this.y - 1 * Math.sin(this.ang);
        }
      }
      show() {
        c.beginPath();
        c.arc(this.x, this.y, this.l / (2 * this.i), 0, 2 * Math.PI);
        c.fillStyle = "rgba(0,200,255,0.4)";
        c.lineWidth = 1;
        c.fill();
      }
    }
  
    class rope {
      constructor(x, y, n, r) {
        this.x = x;
        this.y = y;
        this.n = n;
        this.r = r;
        this.arr = [];
        this.tail = [
          new node(
            this.x + r * Math.cos(0),
            this.y + r * Math.sin(0),
            r / 2,
            0,
            n
          )
        ];
        for (let i = 1; i < n; i++) {
          this.tail.push(
            new node(this.tail[i - 1].nx, this.tail[i - 1].ny, r / 2, i, n)
          );
        }
      }
      follow(m) {
        this.tail[0].follow(m);
        this.update();
      }
      avoid(arr, rad) {
        for (let i = 0, len = this.tail.length; i < len; i++) {
          for (let j = 0, lenj = arr.length; j < lenj; j++) {
            if (this.tail[i] != arr[j] && arr[j].x != mouse.x) {
              this.tail[i].avoid(arr[j], rad);
            }
          }
        }
      }
      update() {
        for (let i = 0, len = this.tail.length; i < len - 1; i++) {
          this.tail[i].update(this.tail[i + 1], this.r);
        }
        for (let i = 1, len = this.tail.length; i < len; i++) {
          this.tail[i].x = this.tail[i - 1].nx;
          this.tail[i].y = this.tail[i - 1].ny;
        }
      }
      show() {
        c.globalCompositeOperation = "lighter";
        c.beginPath();
        for (let i = 0, len = this.tail.length; i < len; i++) {
          c.lineTo(this.tail[i].x, this.tail[i].y);
        }
        c.strokeStyle = "rgba(200,255,255,0.3)";
        c.stroke();
  
        for (let i = 0, len = this.tail.length; i < len; i++) {
          this.tail[i].show();
        }
        c.globalCompositeOperation = "source-over";
      }
    }
  
    class tar {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.pool = [];
        for (let i = 0; i < 20; i++) {
          this.pool.push({ x: Math.random() * w, y: Math.random() * h });
        }
        this.tx = this.pool[0].x;
        this.ty = this.pool[0].y;
        this.lasti = 0;
        this.perception = 300;
      }
      move() {
        this.errx = this.tx - this.x;
        this.erry = this.ty - this.y;
        this.d = Math.sqrt(Math.pow(this.errx, 2) + Math.pow(this.erry, 2));
        this.ta = Math.atan2(this.erry, this.errx);
        this.x = this.x + this.d * 0.02 * Math.cos(this.ta);
        this.y = this.y + this.d * 0.02 * Math.sin(this.ta);
      }
      changeTarget() {
        this.pool.splice(this.lasti, 1);
        this.pool.push({ x: Math.random() * w, y: Math.random() * h });
        for (let i = 0; i < this.pool.length; i++) {
          this.d = Math.sqrt(
            Math.pow(this.pool[i].x - this.x, 2) +
              Math.pow(this.pool[i].y - this.y, 2)
          );
          if (this.d < this.perception) {
            this.tx = this.pool[i].x;
            this.ty = this.pool[i].y;
            this.lasti = i;
            break;
          } else {
            this.tx = this.pool[0].x;
            this.ty = this.pool[0].y;
            this.lasti = 0;
          }
        }
      }
      show() {
        c.beginPath();
        c.arc(this.x, this.y, this.perception, 0, 2 * Math.PI);
        c.fillStyle = "rgba(255,255,255,0.01)";
        c.lineWidth = 1;
        c.fill();
  
        for (let i = 0; i < this.pool.length; i++) {
          c.beginPath();
          c.arc(
            this.pool[i].x,
            this.pool[i].y,
            Math.pow((1.5 * (this.pool.length - i)) / this.pool.length, 5) + 1,
            0,
            2 * Math.PI
          );
          c.fillStyle = "rgba(200,255,200,0.5)";
          c.lineWidth = 1;
          c.fill();
        }
      }
    }
  
    let p = [],
      num = 16,
      target = new tar(Math.random() * w, Math.random() * h);
    for (let i = 0; i < num; i++) {
      p.push(
        new rope(
          Math.random() * w,
          Math.random() * h,
          Math.round(Math.random() * 20 + 10),
          10
        )
      );
    }
  
    for (var i = 0; i < boids.length; i++) {
      boids[i] = new boid();
    }
  
    function draw() {
      for (var boi of boids) {
        boi.flock(boids);
        boi.move();
        boi.show();
      }
  
      target.show();
      if (mouse.x) {
        target.tx = mouse.x;
        target.ty = mouse.y;
      } else {
        if (target.d < 20) {
          target.changeTarget();
        }
      }
      target.move();
      for (let i = 0; i < num; i++) {
        p[i].follow(target);
      }
      for (let i = 0; i < num; i++) {
        p[i].arr = [];
        for (let j = 0; j < num; j++) {
          if (i > j) {
            p[i].arr = p[i].arr.concat(p[j].tail);
          }
        }
        p[i].avoid(p[i].arr, 20);
        p[i].show();
      }
    }
  
    ctx.addEventListener(
      "mousemove",
      function (e) {
        last_mouse.x = mouse.x;
        last_mouse.y = mouse.y;
  
        mouse.x = e.pageX - this.offsetLeft;
        mouse.y = e.pageY - this.offsetTop;
      },
      false
    );
  
    ctx.addEventListener("mouseleave", function (e) {
      mouse.x = false;
      mouse.y = false;
    });
  
    function fitCanvas() {
      w = ctx.width = window.innerWidth;
      h = ctx.height = window.innerHeight;
    }
    function loop() {
      fitCanvas();
      draw();
      window.requestAnimationFrame(loop);
    }
    window.requestAnimationFrame(loop);
  };
  