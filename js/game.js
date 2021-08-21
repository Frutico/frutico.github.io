//game engine
class Game {
  canvas = document.createElement("canvas");
  width = 800;
  height = 400;
  states = [];
  canvas = document.createElement("canvas");
  ctx = null;
  keyboard = { up: false, down: false, left: false, right: false };
  keyboardWasPressed = { up: false, down: false, left: false, right: false };

  update() {
    for (let i = 0; i < this.states.length; i++) {
      this.states[i].update(this);
    }

    this.keyboardWasPressed = JSON.parse(JSON.stringify(this.keyboard));
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.states.length; i++) {
      this.states[i].draw(this.ctx);
    }
  }

  run() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = "100%";
    this.ctx = this.canvas.getContext("2d");
    document.getElementById("game").appendChild(this.canvas);

    let gState = new GameState();
    this.states.push(gState);

    let loop = setInterval(this.mainloop, 10, this);
  }

  mainloop(game) {
    game.update();
    game.draw();
  }

  keyDownHandler(e) {
    if (e.keyCode == 87) this.keyboard.up = true;
    else if (e.keyCode == 83) this.keyboard.down = true;
    else if (e.keyCode == 68) this.keyboard.right = true;
    else if (e.keyCode == 65) this.keyboard.left = true;
  }

  keyUpHandler(e) {
    if (e.keyCode == 87) this.keyboard.up = false;
    else if (e.keyCode == 83) this.keyboard.down = false;
    else if (e.keyCode == 68) this.keyboard.right = false;
    else if (e.keyCode == 65) this.keyboard.left = false;
  }
}

//game state
class GameState {
  player = new Player(15, 150);
  obstacleArr = [];
  score = 0;
  highScore = 0;
  wordSpeed = 8;
  frame = 0;
  spawnTimer = 0;
  scoreText = new Text("", 16, 720, 30);
  highScoreText = new Text("", 16, 600, 30);
  gameOver = false;
  gameoverText = new Text("GAME OVER", 64, 240, 160);
  GameOverScoreText = new Text("000000", 28, 380, 210);
  bg1 = new Img("assets/img/bg.png", 0, 308, 800, 5);
  bg2 = new Img("assets/img/bg.png", 800, 308, 800, 5);

  constructor() {
    this.spawnObstacle();
    this.highScore = this.readScoreFromStorage() || 0;
    this.highScoreText.str = "HI " + this.getScoreStrWPrefix(this.highScore);

    this.spawnTimer = this.getRandomNumberBetween(150, 200);
  }

  update(game) {
    //game over controls
    if (this.gameOver && game.keyboard.up && !game.keyboardWasPressed.up) {
      this.restart();
    } else if (this.gameOver) return;

    this.frame++;
    this.player.update(game);

    //move word
    for (let i = 0; i < this.obstacleArr.length; i++) {
      this.obstacleArr[i].x -= this.wordSpeed * this.obstacleArr[i].speedFactor;
    }

    if (this.score >= 50 && this.wordSpeed < 10) this.wordSpeed += 0.01;
    if (this.score >= 150 && this.wordSpeed < 15) this.wordSpeed += 0.01;

    this.bg1.x -= this.wordSpeed;
    this.bg2.x -= this.wordSpeed;
    if (this.bg1.x <= -700) this.bg1.x = 700;
    if (this.bg2.x <= -700) this.bg2.x = 700;

    //check collision
    for (let i = 0; i < this.obstacleArr.length; i++) {
      if (this.collision(this.player, this.obstacleArr[i])) this.endGame();
    }

    this.calcScore();

    this.tryRemoveFirstObstacle();

    //spawn obstacle
    if (this.spawnTimer <= 0) {
      this.spawnObstacle();
      this.spawnTimer = this.getRandomNumberBetween(25, 80);
    } else {
      this.spawnTimer--;
    }
  }

  draw(ctx) {
    this.bg1.draw(ctx);
    this.bg2.draw(ctx);

    //draw player and obstacles
    for (let i = 0; i < this.obstacleArr.length; i++) {
      this.obstacleArr[i].draw(ctx);
    }

    this.player.draw(ctx);
    this.scoreText.draw(ctx);

    if (this.highScore > 0) {
      this.highScoreText.draw(ctx);
    }

    if (this.gameOver) {
      this.gameoverText.draw(ctx);
      this.GameOverScoreText.draw(ctx);
    }
  }

  restart() {
    //try save hight score
    let prevScore = this.readScoreFromStorage();
    if (this.highScore < this.score) {
      this.highScore = this.score;
      this.saveScoreToStorage();
      this.highScoreText.str = "HI " + this.getScoreStrWPrefix(this.highScore);
    }

    //reset stats and obstacles
    this.score = 0;
    this.obstacleArr = [];
    this.wordSpeed = 8;
    this.player.reset();
    this.frame = 0;
    this.gameOver = false;
  }

  collision(a, b) {
    if (
      (b.x >= a.x && b.x <= a.x + a.width) ||
      (b.x + b.width >= a.x && b.x + b.width <= a.x + a.width)
    ) {
      if (
        (b.y >= a.y && b.y <= a.y + a.height) ||
        (b.y + b.height >= a.y && b.y + b.height <= a.y + a.height)
      ) {
        return true;
      }
    }

    return false;
  }

  endGame() {
    this.wordSpeed = 0;
    this.player.speed = 0;
    this.gameOver = true;
    this.GameOverScoreText.str = this.getScoreStrWPrefix(this.score);
  }

  calcScore() {
    if (this.frame % 8 == 0 && !this.gameOver) {
      this.score++;
      this.scoreText.str = this.getScoreStrWPrefix(this.score);
    }
  }

  saveScoreToStorage() {
    window.localStorage.setItem("gamescore", this.highScore);
  }

  readScoreFromStorage() {
    let data = window.localStorage.getItem("gamescore");
    return data;
  }

  getScoreStrWPrefix(scr) {
    let str = "";
    let prefix = "00000";
    if (scr >= 10 && scr < 100) prefix = "0000";
    if (scr >= 100 && scr < 1000) prefix = "000";
    if (scr >= 1000 && scr < 10000) prefix = "00";
    if (scr >= 10000 && scr < 100000) prefix = "0";
    if (scr >= 100000) prefix = "";
    str = prefix + scr;
    return str;
  }

  tryRemoveFirstObstacle() {
    if (this.obstacleArr.length == 0) return;

    if (this.obstacleArr[0].x < -100) {
      this.obstacleArr.shift();
    }
  }

  spawnObstacle() {
    let type = 0;
    //rand type
    if (this.score >= 10 && this.score < 100)
      type = this.getRandomNumberBetween(0, 4);
    if (this.score >= 100 && this.score < 150)
      type = this.getRandomNumberBetween(0, 5);
    if (this.score >= 150) type = this.getRandomNumberBetween(0, 6);

    this.obstacleArr.push(new Obstacle(900, 250, type));
  }

  getRandomNumberBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}

//sound
class Sound {
  sound = document.createElement("audio");
  constructor(src) {
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
  }

  play() {
    this.sound.play();
  }

  stop() {
    this.sound.pause();
  }
}

//entity
class Entity {
  x = 0;
  y = 0;
  width = 0;
  height = 0;
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }

  set x(x) {
    this.x = x;
  }

  get x() {
    return this.x;
  }

  set y(y) {
    this.y = y;
  }

  get y() {
    return this.y;
  }
}

//text
class Text extends Entity {
  str = "";
  font = "16px ROBOTO";
  color = "green";
  constructor(str, size, x, y) {
    super(x, y, 0, 0);
    this.str = str;
    this.font = size + "px ROBOTO";
  }

  draw(ctx) {
    ctx.font = this.font;
    ctx.fillStyle = this.color;
    ctx.fillText(this.str, this.x, this.y);
  }
}

//image
class Img extends Entity {
  img = new Image();

  constructor(src, x, y, w, h) {
    super(x, y, w, h);
    this.img.src = src;
  }

  draw(ctx) {
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }
}

//obstacle
class Obstacle extends Entity {
  speedFactor = 1;
  constructor(x, y, type) {
    switch (type) {
      case 0:
        super(x, y + 30, 30, 30);
        break;
      case 1:
        super(x, y + 30, 50, 30);
        break;
      case 2:
        super(x, y + 30, 70, 30);
        break;
      case 3:
        super(x, y - 5, 30, 30);
        break;
      case 4:
        super(x, y - 25, 30, 30);
        break;
      case 5:
        super(x, y, 30, 30);
        break;
      case 6:
        super(x, y - 35, 60, 60);
        break;
    }
  }

  draw(ctx) {
    ctx.fillStyle = "green";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

//player
class Player extends Entity {
  speed = 0;
  gravity = 1;
  canJump = true;
  canDuck = true;
  startPos = { x: 0, y: 0 };
  jumpSound = new Sound("assets/audio/jump_8bit_plop.ogg");
  constructor(x, y) {
    super(x, y, 30, 60);
    this.startPos.x = x;
    this.startPos.y = y;
  }

  update(game) {
    if (this.y + this.height < 310) {
      this.speed += this.gravity;
    } else {
      this.canJump = true;
      this.speed = 0;
      this.y = 310 - this.height;
    }

    if (game.keyboard.down && !game.keyboardWasPressed.down) {
      this.canJump = false;
      this.duck();
    }

    if (!game.keyboard.down && game.keyboardWasPressed.down) {
      this.unduck();
    }

    if (game.keyboard.up && this.canJump && !game.keyboard.down) this.jump();

    this.y += this.speed;
  }

  draw(ctx) {
    ctx.fillStyle = "red";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  reset() {
    this.speed = 0;
    this.canJump = true;
    this.canDuck = true;
    this.height = 60;
    this.x = this.startPos.x;
    this.y = this.startPos.y;
  }

  jump() {
    this.speed -= 14;
    this.canJump = false;
    this.jumpSound.play();
  }

  duck() {
    this.y += 30;
    this.height = 30;
  }

  unduck() {
    this.y -= 30;
    this.height = 60;
  }
}

//main
let game = new Game();
window.addEventListener("load", function () {
  game.run();
});

//keyboard events
window.addEventListener("keydown", function (e) {
  game.keyDownHandler(e);
});
window.addEventListener("keyup", function (e) {
  game.keyUpHandler(e);
});
