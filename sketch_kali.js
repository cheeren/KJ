// sketch_kali.js
// Kaleidoscope — p5.js port of C++/SFML original by Cinda Heeren (2015)
//
// Drop any image onto the window to use it as the source texture.
// Click thumbnails in the right panel to switch images.

const PANEL_W  = 210; // width of right panel (must match CSS in index.html)
const SPEED    = 25;  // rotation speed, degrees/second
const INSET_W  = 180; // image preview inset width in pixels

let img, sin60;
let texCenter, texP1, texP2;
let lastTime, triSize;
let cols, rows;

function preload() {
  img = loadImage('wildflowers.jpg', null, () => { img = null; });
}

function setup() {
  let cnv = createCanvas(windowWidth - PANEL_W, windowHeight, WEBGL);
  cnv.parent('canvas-container');
  sin60 = sqrt(3) / 2;
  textureMode(NORMAL);
  textureWrap(CLAMP);

  if (!img) img = makeProceduralTexture(600, 400);

  computeLayout();
  initTexture();
  lastTime = millis();

  // Expose image-switcher for the HTML panel
  window._kaliSetImage = (src) => {
    loadImage(src, newImg => { img = newImg; initTexture(); });
  };
}

// ---------------------------------------------------------------------------
// Layout — fills the full canvas with hexagons + extra tiles to bleed edges
// ---------------------------------------------------------------------------

function computeLayout() {
  // Size hexes so ~6 rows fit vertically; cols computed to overfill width
  triSize = height / (sqrt(3) * 5.5);
  cols = ceil(width  / (1.5   * triSize)) + 4;
  rows = ceil(height / (sqrt(3) * triSize)) + 3;
}

// ---------------------------------------------------------------------------
// Texture triangle — sized to fit entirely within image bounds
// ---------------------------------------------------------------------------

function initTexture() {
  let r = min(img.width, img.height) * 0.42; // largest circle that stays inside
  texCenter = createVector(img.width / 2, img.height / 2);
  texP1     = createVector(img.width / 2 + r,     img.height / 2);
  texP2     = createVector(img.width / 2 + r / 2, img.height / 2 + sin60 * r);
}

// Rotate pt around about by angleDeg. Matches original C++ doRotation().
function doRotation(about, pt, angleDeg) {
  let a = radians(angleDeg);
  let c = cos(a), s = sin(a);
  let dx = pt.x - about.x, dy = pt.y - about.y;
  return createVector(dx * c + dy * s + about.x,
                      dy * c - dx * s + about.y);
}

function rollTexture(angleDeg) {
  texP1 = doRotation(texCenter, texP1, angleDeg);
  texP2 = doRotation(texCenter, texP2, angleDeg);
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

// One hex tile: 6 equilateral triangles, alternating UV to create mirror symmetry
function drawSnowflake() {
  noStroke();
  texture(img);

  let cx  = texCenter.x / img.width,  cy  = texCenter.y / img.height;
  let p1x = texP1.x     / img.width,  p1y = texP1.y     / img.height;
  let p2x = texP2.x     / img.width,  p2y = texP2.y     / img.height;

  const rim = [
    [ triSize,       0              ],
    [ triSize / 2,   sin60 * triSize],
    [-triSize / 2,   sin60 * triSize],
    [-triSize,       0              ],
    [-triSize / 2,  -sin60 * triSize],
    [ triSize / 2,  -sin60 * triSize],
  ];

  beginShape(TRIANGLES);
  for (let k = 0; k < 6; k++) {
    let next = (k + 1) % 6;
    let [uax, uay] = k % 2 === 0 ? [p1x, p1y] : [p2x, p2y];
    let [ubx, uby] = k % 2 === 0 ? [p2x, p2y] : [p1x, p1y];
    vertex(0,            0,            cx,  cy );
    vertex(rim[k][0],    rim[k][1],    uax, uay);
    vertex(rim[next][0], rim[next][1], ubx, uby);
  }
  endShape();
}

function draw() {
  background(18, 20, 24);

  let now  = millis();
  let delta = constrain((now - lastTime) / 1000, 0, 0.1);
  lastTime = now;
  rollTexture(SPEED * delta);

  // --- Fill canvas with hex grid; grid is larger than canvas so edges bleed ---
  let gridW = 1.5   * triSize * (cols - 1);
  let gridH = sqrt(3) * triSize * (rows - 1);

  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < rows; i++) {
      let x = -gridW / 2 + 1.5 * triSize * j;
      let y = -gridH / 2 + sqrt(3) * triSize * i + sin60 * triSize * (j % 2);
      push();
      translate(x, y);
      drawSnowflake();
      pop();
    }
  }

  // --- Image inset + rotating red triangle (top-right corner) ---
  let insetH     = INSET_W * img.height / img.width;
  let insetX     = width  / 2 - INSET_W - 12;
  let insetY     = -height / 2 + 12;
  let insetScale = INSET_W / img.width;

  push();
  noStroke();
  image(img, insetX, insetY, INSET_W, insetH);
  noFill();
  stroke(255, 0, 0);
  strokeWeight(2);
  triangle(
    insetX + texCenter.x * insetScale, insetY + texCenter.y * insetScale,
    insetX + texP1.x     * insetScale, insetY + texP1.y     * insetScale,
    insetX + texP2.x     * insetScale, insetY + texP2.y     * insetScale
  );
  pop();
}

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------

function drop(file) {
  if (file.type === 'image') {
    loadImage(file.data, newImg => { img = newImg; initTexture(); });
  }
}

function windowResized() {
  resizeCanvas(windowWidth - PANEL_W, windowHeight);
  computeLayout();
}

// ---------------------------------------------------------------------------
// Fallback texture when no image file is present
// ---------------------------------------------------------------------------

function makeProceduralTexture(w, h) {
  let g = createGraphics(w, h);
  g.background(20, 30, 60);
  g.noStroke();
  for (let i = 0; i < 300; i++) {
    g.fill(random(80, 255), random(40, 200), random(80, 255), random(140, 220));
    g.ellipse(random(w), random(h), random(20, 110), random(20, 110));
  }
  return g;
}
