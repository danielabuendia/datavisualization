let bk;
let drawerImg;
let folderLA, folderSD, folderSJ;
let paperLA, paperSD, paperSJ;

let icoBeds, icoPeople;
let icoSpring, icoSummer, icoAutumn;

const DRAWER_W = 2000;
const FOLDER_W = 500;
const STEP_Y = 14;
const BG_GRAY = 255;

const GROUP_OFFSET_FROM_CENTER = 120;
const FOLDER_OFFSET_Y = -80;

const TAB_W_FACTOR = 0.23;
const TAB_H_FACTOR = 0.12;
const TAB_TOP_INSET = 0.06;

const TAB_SHIFT_SD = -0.22;
const TAB_SHIFT_SJ = 0.0;
const TAB_SHIFT_LA = 0.22;

const PAPER_MAX_FRAC = 0.9;
let currentPaper = null;

const DECOR_FRAC = 0.22;
const DECOR_GAP = 0.02;

const GAP_NUMBER_ICON = 90;
const GAP_ICON_LABEL = 60;
const NUMBER_Y_OFFSET_FRAC = 0.12;

const CARD_SHIFT_FRAC = 0.24;
const LABEL_BEDS = "Beds Available";
const LABEL_CAPACITY = "Total Capacity";
const LABEL_SEASON = "Season";

const LABEL_SEPARATION = 0;

const COL_SPACING_FACTOR = 0.45;

const CONTENT_BIAS_FRAC_BY_CITY = {
  SD: 0.008,
  SJ: -0.013,
  LA: 0.008,
};

const TITLE_SHIFT_X = 0;
const TITLE_SHIFT_Y = 16;

const DOTS_Y_FROM_BOTTOM_FRAC = 0.03;
const DOT_SIZE = 10;
const DOT_GAP = 16;
const DOTS_CENTER_BIAS_FRAC_BY_CITY = { SD: 0.03, SJ: 0.006, LA: 0.03 };

const OCC_BAR_H = 26;
const OCC_BAR_R = 20;
const OCC_BAR_MTOP = 36;
const OCC_BAR_WIDTH_FRAC = 0.6;
const OCC_TRACK = [228, 231, 240];
const OCC_FROM = [210, 220, 255];
const OCC_TO = [60, 90, 255];

let ANCHOR_X, ANCHOR_Y;

const folders = {
  LA: { x: 0, y: 0, w: 0, h: 0, tab: { x: 0, y: 0, w: 0, h: 0 } },
  SJ: { x: 0, y: 0, w: 0, h: 0, tab: { x: 0, y: 0, w: 0, h: 0 } },
  SD: { x: 0, y: 0, w: 0, h: 0, tab: { x: 0, y: 0, w: 0, h: 0 } },
};

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTDeNdpBx69ZrLBmJupfm6j2vniuh6ycCXqqfjIrevlV2hJB8-O3S73a38IYxphYa-EwagEISXEutzj/pub?gid=0&single=true&output=csv";

let sheltersTable = null;
let csvReady = false;
let columnsDetected = false;
let filteredShelters = [];

let COL_CITY, COL_SHELTER, COL_CAPACITY, COL_AVAIL, COL_SEASON, COL_OCC;

let slide = 0;
let offsetX = 0;
let startX = 0;
let dragging = false;

function preload() {
  bg = loadImage("bghs.jpg");
  drawerImg = loadImage("drawer.PNG");
  folderLA = loadImage("folder_la.PNG");
  folderSD = loadImage("folder_sd.PNG");
  folderSJ = loadImage("folder_sj.PNG");
  paperLA = loadImage("paper_la.PNG");
  paperSD = loadImage("paper_sd.PNG");
  paperSJ = loadImage("paper_sj.PNG");

  icoBeds = loadImage("bedavailables.png");
  icoPeople = loadImage("peoplecapacity.png");

  icoSpring = loadImage("Spring.PNG");
  icoSummer = loadImage("Summer.PNG");
  icoAutumn = loadImage("Autumn.PNG");

  sheltersTable = loadTable(
    CSV_URL,
    "csv",
    "header",
    () => {
      csvReady = true;
    },
    (err) => {
      console.error("Error CSV:", err);
      csvReady = true;
    }
  );
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  if (csvReady && sheltersTable) {
    detectColumns();
    columnsDetected = true;
  }
}

function draw() {
  push();
  imageMode(CORNER);
  image(bg, 0, 0, width, height);
  pop();
  if (!columnsDetected && csvReady) {
    if (sheltersTable) detectColumns();
    columnsDetected = true;
  }

  ANCHOR_X = width / 2;
  ANCHOR_Y = height / 2;

  const drawerH = DRAWER_W * (drawerImg.height / drawerImg.width);
  image(drawerImg, ANCHOR_X, ANCHOR_Y, DRAWER_W, drawerH);

  const laH = FOLDER_W * (folderLA.height / folderLA.width);
  const sjH = FOLDER_W * (folderSJ.height / folderSJ.width);
  const sdH = FOLDER_W * (folderSD.height / folderSD.width);

  const x = ANCHOR_X;
  const baseY = ANCHOR_Y + GROUP_OFFSET_FROM_CENTER + FOLDER_OFFSET_Y;

  image(folderLA, x, baseY - STEP_Y * 4, FOLDER_W, laH);
  image(folderSJ, x, baseY - STEP_Y * 2, FOLDER_W, sjH);
  image(folderSD, x - 9, baseY - STEP_Y * 0.02, FOLDER_W, sdH); // SD un poco a la izquierda

  folders.LA = setBounds(x, baseY - STEP_Y * 4, FOLDER_W, laH, TAB_SHIFT_LA);
  folders.SJ = setBounds(x, baseY - STEP_Y * 2, FOLDER_W, sjH, TAB_SHIFT_SJ);
  folders.SD = setBounds(
    x - 9,
    baseY - STEP_Y * 0.02,
    FOLDER_W,
    sdH,
    TAB_SHIFT_SD
  );

  if (overTab(folders.SD) || overTab(folders.SJ) || overTab(folders.LA))
    cursor(HAND);
  else cursor(ARROW);

  if (currentPaper) {
    noStroke();
    fill(0, 180);
    rectMode(CORNER);
    rect(0, 0, width, height);

    const img =
      currentPaper === "SD"
        ? paperSD
        : currentPaper === "SJ"
        ? paperSJ
        : paperLA;

    const maxW = width * PAPER_MAX_FRAC;
    const maxH = height * PAPER_MAX_FRAC;
    const scale = Math.min(maxW / img.width, maxH / img.height);
    const w = img.width * scale;
    const h = img.height * scale;

    image(img, ANCHOR_X, ANCHOR_Y, w, h);

    drawCardCentered(w, h);
    return;
  }
}

function mousePressed() {
  if (currentPaper) {
    dragging = true;
    startX = mouseX;
    offsetX = 0;
    return;
  }
  const tab = getTabUnderMouseSmart();
  if (tab) {
    currentPaper = tab;
    if (csvReady) {
      if (tab === "SD") filterSheltersFor("San Diego");
      else if (tab === "SJ") filterSheltersFor("San Jose");
      else filterSheltersFor("Los Angeles");
    }
    slide = 0;
  }
}

function mouseDragged() {
  if (currentPaper && dragging) offsetX = mouseX - startX;
}

function mouseReleased() {
  if (currentPaper && dragging) {
    dragging = false;
    const TH = 60;
    const last = (filteredShelters?.length || 1) - 1;

    if (offsetX < -TH && slide < last) slide++;
    else if (offsetX > TH && slide > 0) slide--;
    else if (Math.abs(offsetX) < 8) currentPaper = null;

    offsetX = 0;
    return;
  }
}

function keyPressed() {
  if (key === "Escape") currentPaper = null;
  if (currentPaper && filteredShelters.length) {
    const last = filteredShelters.length - 1;
    if (keyCode === RIGHT_ARROW && slide < last) slide++;
    if (keyCode === LEFT_ARROW && slide > 0) slide--;
  }
}

function getTabUnderMouseSmart() {
  const cands = [];
  for (const key of ["SD", "SJ", "LA"]) {
    const f = folders[key];
    const r = f.tab;
    const halfW = r.w / 2,
      halfH = r.h / 2;
    const inside =
      mouseX >= r.x - halfW &&
      mouseX <= r.x + halfW &&
      mouseY >= r.y - halfH &&
      mouseY <= r.y + halfH;
    if (inside) cands.push({ key, dist: Math.abs(mouseX - r.x) });
  }
  if (!cands.length) return null;
  cands.sort((a, b) => a.dist - b.dist);
  return cands[0].key;
}

function setBounds(cx, cy, w, h, tabShiftFactor) {
  const f = { x: cx, y: cy, w, h, tab: { x: 0, y: 0, w: 0, h: 0 } };
  const tabW = w * TAB_W_FACTOR;
  const tabH = h * TAB_H_FACTOR;
  const topY = cy - h / 2;
  const tabCy = topY + h * TAB_TOP_INSET + tabH / 2;
  const tabCx = cx + w * tabShiftFactor;
  f.tab = { x: tabCx, y: tabCy, w: tabW, h: tabH };
  return f;
}
function overTab(f) {
  const r = f.tab,
    halfW = r.w / 2,
    halfH = r.h / 2;
  return (
    mouseX >= r.x - halfW &&
    mouseX <= r.x + halfW &&
    mouseY >= r.y - halfH &&
    mouseY <= r.y + halfH
  );
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function detectColumns() {
  COL_CITY = "city";
  COL_SHELTER = "shelter_name";
  COL_CAPACITY = "total_capacity";
  COL_AVAIL = "available_beds";
  COL_SEASON = "season";
  COL_OCC = "occupancy_rate";
}

function filterSheltersFor(cityName) {
  filteredShelters = [];
  if (!sheltersTable) return;

  const rows = sheltersTable.getRows();
  const wanted = (cityName || "").toLowerCase().trim();

  for (let r of rows) {
    const city = (r.getString(COL_CITY) || "").toLowerCase().trim();
    if (city !== wanted) continue;

    let occ = parseFloat(r.getString(COL_OCC));
    if (isFinite(occ)) {
      if (occ > 1) occ = occ / 100;
      occ = constrain(occ, 0, 1);
    } else {
      const cap = +r.getString(COL_CAPACITY) || 0;
      const av = +r.getString(COL_AVAIL) || 0;
      const used = Math.max(0, cap - av);
      occ = cap > 0 ? used / cap : 0;
    }

    filteredShelters.push({
      name: (r.getString(COL_SHELTER) || "").trim(),
      avail: (r.getString(COL_AVAIL) || "").trim(),
      cap: (r.getString(COL_CAPACITY) || "").trim(),
      season: (r.getString(COL_SEASON) || "").trim(),
      occ: occ,
    });
  }

  filteredShelters.sort((a, b) =>
    a.name.localeCompare(b.name, "es", { sensitivity: "base" })
  );
}

function getContentBox(w, h) {
  const padXLeft = w * 0.14;
  const padXRight = w * 0.12;
  const padY = h * 0.13;

  const decorW = w * DECOR_FRAC;
  const decorGap = w * DECOR_GAP;

  let contentLeft = ANCHOR_X - w / 2 + padXLeft;
  let contentRight = ANCHOR_X + w / 2 - padXRight - decorW - decorGap;
  const top = ANCHOR_Y - h / 2 + padY;
  const bottom = ANCHOR_Y + h / 2 - padY;

  const biasFrac = CONTENT_BIAS_FRAC_BY_CITY[currentPaper] || 0;
  const biasPx = w * biasFrac;
  contentLeft += biasPx;
  contentRight += biasPx;

  return { contentLeft, contentRight, top, bottom };
}

function drawCardCentered(w, h) {
  push();
  textFont("Helvetica");

  const { contentLeft, contentRight, top, bottom } = getContentBox(w, h);
  const innerW = contentRight - contentLeft;

  if (!csvReady || !sheltersTable || !filteredShelters.length) {
    fill(30);
    textSize(20);
    textAlign(LEFT, TOP);
    text(
      !csvReady ? "Loading..." : "No hay shelters para esta ciudad.",
      contentLeft,
      top
    );
    pop();
    return;
  }

  const biasFrac = CONTENT_BIAS_FRAC_BY_CITY[currentPaper] || 0;
  const biasPx = w * biasFrac;

  const cx = contentLeft + innerW / 2;
  const s = innerW * COL_SPACING_FACTOR;
  const cardShift = innerW * CARD_SHIFT_FRAC;

  const colCenter = cx + cardShift;
  const colLeft = cx - s + cardShift;
  const colRight = cx + s + cardShift;

  const titleY = top + 65;
  const numberY = top + h * (240 / 900) + h * NUMBER_Y_OFFSET_FRAC;
  const iconY = numberY + GAP_NUMBER_ICON;
  const labelY = iconY + GAP_ICON_LABEL;

  const N = filteredShelters.length;
  const pagesToDraw = [slide];
  if (offsetX < 0 && slide < N - 1) pagesToDraw.push(slide + 1);
  if (offsetX > 0 && slide > 0) pagesToDraw.push(slide - 1);

  for (const p of pagesToDraw) {
    const s_ = filteredShelters[p];
    const dx = (p - slide) * w + offsetX;

    push();
    translate(dx, 0);

    const title = s_.name || "Sin nombre";
    let titleSize = 60;
    textStyle(BOLD);
    textAlign(LEFT, CENTER);
    textSize(titleSize);
    while (textWidth(title) > innerW && titleSize > 16) {
      titleSize--;
      textSize(titleSize);
    }
    fill(20);
    const titleX = contentLeft - biasPx + TITLE_SHIFT_X;
    const titleYFinal = titleY + TITLE_SHIFT_Y;
    text(title, titleX, titleYFinal);

    const barY = titleYFinal + OCC_BAR_MTOP;
    drawOccBarUnderTitle(
      contentLeft - biasPx,
      contentRight - biasPx,
      barY,
      s_.occ ?? 0
    );

    drawSeasonBlock(colLeft, labelY, s_.season, numberY);
    drawMetricBlock(
      colCenter,
      numberY,
      iconY,
      labelY,
      icoBeds,
      s_.avail,
      LABEL_BEDS,
      0
    );
    drawMetricBlock(
      colRight,
      numberY,
      iconY,
      labelY,
      icoPeople,
      s_.cap,
      LABEL_CAPACITY,
      +LABEL_SEPARATION
    );

    pop();
  }

  const dotsY = bottom - h * DOTS_Y_FROM_BOTTOM_FRAC;
  const totalW = N * DOT_SIZE + (N - 1) * DOT_GAP;

  const dotsBiasFrac = DOTS_CENTER_BIAS_FRAC_BY_CITY[currentPaper] || 0;
  const dotsCenterX = ANCHOR_X + w * dotsBiasFrac;

  let dotsX = dotsCenterX - totalW / 2;
  for (let i = 0; i < N; i++) {
    noStroke();
    fill(i === slide ? 30 : 150);
    circle(dotsX, dotsY, DOT_SIZE);
    dotsX += DOT_SIZE + DOT_GAP;
  }

  pop();
}

function drawMetricBlock(
  x,
  yNumber,
  yIcon,
  yLabel,
  iconImg,
  value,
  label,
  labelXOffset = 0
) {
  textFont("Helvetica");
  textAlign(CENTER, CENTER);

  fill(15);
  textStyle(BOLD);
  textSize(50);
  text(value ? Number(value).toLocaleString() : "-", x, yNumber);

  if (iconImg) image(iconImg, x, yIcon, 64, 64);

  fill(30);
  textStyle(NORMAL);
  textSize(22);
  text(label, x + labelXOffset, yLabel);
}

function drawSeasonBlock(x, labelY, seasonRaw, titleYOverride = null) {
  textFont("Helvetica");
  textAlign(CENTER, CENTER);

  const raw = (seasonRaw || "").trim();
  const s = raw.toLowerCase();
  let img = icoAutumn;
  if (s.includes("spring")) img = icoSpring;
  else if (s.includes("summer")) img = icoSummer;
  else if (s.includes("autumn") || s.includes("fall")) img = icoAutumn;

  const iconY = labelY - GAP_ICON_LABEL;

  const seasonTitleY =
    titleYOverride !== null && titleYOverride !== undefined
      ? titleYOverride
      : iconY - 50;

  fill(40);
  textStyle(BOLD);
  textSize(30);
  text(raw || "-", x, seasonTitleY);

  if (img) image(img, x, iconY, 56, 56);

  fill(30);
  textStyle(NORMAL);
  textSize(22);
  text(LABEL_SEASON, x, labelY);
}

function drawOccBarUnderTitle(left, right, y, frac) {
  const innerW = right - left;
  const w = innerW * OCC_BAR_WIDTH_FRAC;
  const x = left;
  const h = OCC_BAR_H;

  noStroke();
  fill(OCC_TRACK[0], OCC_TRACK[1], OCC_TRACK[2]);
  rect(x, y, w, h, OCC_BAR_R);

  const ctx = drawingContext;
  ctx.save();
  const r = OCC_BAR_R;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.clip();

  const fw = constrain(w * (frac || 0), 0, w);
  for (let i = 0; i < fw; i++) {
    const t = fw <= 1 ? 1 : i / fw;
    const R = lerp(OCC_FROM[0], OCC_TO[0], t);
    const G = lerp(OCC_FROM[1], OCC_TO[1], t);
    const B = lerp(OCC_FROM[2], OCC_TO[2], t);
    stroke(R, G, B);
    line(x + i, y, x + i, y + h);
  }
  noStroke();
  ctx.restore();

  const perc = Math.round((frac || 0) * 100);
  fill(30);
  textFont("Helvetica");
  textSize(14);
  textAlign(RIGHT, CENTER);
  text(`${perc}%`, x + w - 8, y + h / 2);
}
