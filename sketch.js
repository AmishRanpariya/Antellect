class Colony {

  // Colony class contains the colony of ANTs with their methods
  constructor() {
    this.totalAnt = colonySize;
    this.ants = [];
    for (let i = 0; i < this.totalAnt; i++) {
      this.ants.push(new Ant());
    }
    this.matingpool = [];
  }

  show() {
    //rendering the colony
    for (let ant of this.ants) {
      ant.show();
    }
  }

  update() {
    //updating all ants position
    for (let ant of this.ants) {
      ant.update();
    }
  }

  checkCollision(obstacles) {
    //checking for the collision of any ant with obstacles array
    for (let ant of this.ants) {
      ant.collide(obstacles);
    }
  }

  evaluate() {
    let maxFit = 0;
    //calculating the fitness of all ants
    for (let ant of this.ants) {
      ant.calcFitness();
      if (ant.fitness > maxFit) {
        maxFit = ant.fitness;
      }
    }
    this.matingpool = [];
    // adding the ants into the matingpool. 
    // more the fitness more the no. of times that ant added and more will be the probability of that ant to be chosen for mating.
    for (let ant of this.ants) {
      let n = ant.fitness * 10;

      for (let j = 0; j < n; j++) {
        this.matingpool.push(ant);
      }
    }
  }

  selection() {
    let newCol = [];
    //Here choosing two parent from the mating pool and then crossover their DNA and Making child from that DNA with some Mutation in DNA.
    // mutation rate is defined in mutation method.
    for (let i = 0; i < this.totalAnt; i++) {
      let parentADNA = random(this.matingpool).dna;
      let parentBDNA = random(this.matingpool).dna;

      let childDNA = parentADNA.crossover(parentBDNA);
      childDNA.mutation();
      newCol.push(new Ant(childDNA));
    }
    this.ants = newCol;
  }

}




class DNA {
  // DNA holds the array of step on which direction the ant will walk.

  constructor(genes) {
    if (genes) {
      this.genes = genes;
    }
    else {
      this.genes = [];
      for (let i = 0; i < lifeSpan; i++) {
        this.genes[i] = p5.Vector.random2D();
        this.genes[i].setMag(maxForce);
      }
    }
  }

  crossover(dna2) {
    // crossovering the DNAs of parent.
    // some portion of DNA will be of parentA and some will be of parentB.
    let newGenes = [];
    let pivot = random(this.genes.length);
    for (let i = 0; i < this.genes.length; i++) {
      if (i > pivot) {
        newGenes.push(dna2.genes[i]);
      }
      else {
        newGenes.push(this.genes[i]);
      }
    }
    return new DNA(newGenes);
  }
  mutation() {
    const MUTATION_RATE = 0.01; //10%
    for (let i = 0; i < lifeSpan; i++) {
      if (random() < MUTATION_RATE)
      {
        this.genes[i] = p5.Vector.random2D();
        this.genes[i].setMag(maxForce);
      }
    }
  }
}


 
 
class Ant {
  constructor(dna) {
    this.pos = createVector(width / 2, height - 10);
    this.vel = createVector();
    this.acc = createVector();
    if (dna) {
      this.dna = dna;
    }
    else {
      this.dna = new DNA();
    }
    this.fitness = 0;
    this.agetoReach = lifeSpan;
    this.isReached = false;
    this.isDead = false;
  }

  show() {
    push();
    noStroke();
    colorMode(HSB, 255);
    let hue = 100 - (100 * count / lifeSpan);
    //hue 100=green
    //hue 0=red
    //hue goes to RED as ants goes to die.
    fill(hue, 200, 255, 160);
    if (this.isDead) {
      fill(0, 200, 255, 160);
    }
    rectMode(CENTER);
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());
    rect(0, 0, 25, 8, 10);
    pop();
  }

  applyForce(force) {
    this.acc.mult(0);
    this.acc.add(force);
  }

  update() {

    //checkingif ant reached to target(marshmellow)
    if (!this.isReached && dist(this.pos.x, this.pos.y, target.x, target.y) < 10) {
      this.isReached = true;
      this.agetoReach = count;
    }
    //applyForce only if ant is not reached or not dead
    if ((!this.isReached) && (!this.isDead)) {
      this.applyForce(this.dna.genes[count]);
      this.vel.add(this.acc);
      this.vel.mult(0.9);
      //  this.vel.normalize();
      //this.vel.limit(20);
      this.pos.add(this.vel);
    }

    //checking collision with boundary    
    if (this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height) {
      this.isDead = true;
    }
  }

  collide(obstacles) {

    // checking collision with obstacles 
    if (!this.isReached && !this.isDead) {
      for (let obstacle of obstacles) {

        if (this.pos.x < obstacle.pos.x + obstacle.width &&
          this.pos.x > obstacle.pos.x &&
          this.pos.y < obstacle.pos.y + obstacle.height &&
          this.pos.y > obstacle.pos.y) {
          this.isDead = true;
        }
      }
    }
  }

  calcFitness() {
    let d = dist(this.pos.x, this.pos.y, target.x, target.y);
    // fitness is mapped according to the distance between the target and the ant
    // less distance => more fitness
    this.fitness = map(d, 0, height, 10, 0);

    if (this.isReached) {
      // if reached  => more fitness
      // if reached in less time => much more fitness
      this.fitness *= (10 * lifeSpan / this.agetoReach);
    }

    if (this.isDead) {
      // if dead => less fitness
      this.fitness /= 10;
    }
  }
}



class Obstacle {
  // user defined obstaclewith mouse.
  // pos is the position of top left corner of the obstacle.
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.width = 10;
    this.height = 10;
  }

  show() {
    // rendering the obstacle
    fill(255, 150);
    rectMode(CORNER);
    rect(this.pos.x, this.pos.y, this.width, this.height);
  }

  resize() {
    this.width = mouseX - this.pos.x;
    this.height = mouseY - this.pos.y;
  }
  update() {

    if (this.width < 0) {
      this.pos.x += this.width;
      this.width *= -1;
    }
    if (this.height < 0) {
      this.pos.y += this.height;
      this.height *= -1;
    }
  }

}


// OBSTACLE FUNCTIONS
function makeObstacle() {
  //creating new obstacle
  let o = new Obstacle(mouseX, mouseY);
  obstacles.push(o);
  obstaclesCount++;
}

function resizeObstacle() {
  //resizing the last obstacle as mouse position changes
  obstacles[obstaclesCount - 1].resize();
}

function updateObstacle() {
  // resizing and updating the last obstacle last time as mouse button up or touch ends
  obstacles[obstaclesCount - 1].resize();
  obstacles[obstaclesCount - 1].update();
}

function touchStarted() {
  if (mouseX < width && mouseY < height)
  {
    makeObstacle();
  }
}

function touchMoved() {
  if (mouseX < width && mouseY < height)
  {
    resizeObstacle();
  }
}

function touchEnded() {
  if (mouseX < width && mouseY < height)
  {
    updateObstacle();
  }
}



// GLOBAL VARS

let col; //current colony
let lifeSpan = 1000; //total no. of frames for one colony to live.
let colonySize = 100; //total no. of ants in one colony
let maxForce = 1;
let count = 0;
let target; //marshmellow
let obstacles = []; //user drawn obstacles
let obstaclesCount = 0; //no. of obstacles
let canvas;
let slider; //speed slider


function setup() {
  canvas = createCanvas(windowWidth, windowHeight * 0.9);
  col = new Colony();
  target = createVector(width / 2, 50);

  slider = createSlider(1, 100, 1);
  slider.class('custom-range p-2 mt-2');

}


function draw() {

  //loop to speed up the process
  // Doing the updating work slider.value times but drawing the colony only once in a frame
  for (let i = 0; i < slider.value(); i++)
  {
    col.update();
    col.checkCollision(obstacles);
    if (count === lifeSpan) {
      count = 0;
      col.evaluate();
      col.selection();
    }
    count++;
  }

  //Below things are drawn once per frame.
  background(0);
  col.show();
  fill(255);
  ellipse(target.x, target.y, 20, 20);
  for (let obstacle of obstacles) {
    obstacle.show();
  }
}