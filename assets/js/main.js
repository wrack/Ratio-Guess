let widthInput = document.getElementById('width'),
    heightInput = document.getElementById('height'),
    ggtWidthOutput = document.getElementById('ggtWidth'),
    ggtHeightOutput = document.getElementById('ggtHeight'),
    ratioOut = document.getElementById('ratio'),
    heatMapX = document.getElementById('heatMapX'),
    heatMapY = document.getElementById('heatMapY'),
    heatMapContainer = document.getElementById('heatMapContainer'),
    heatMap = document.getElementById('heatMap'),
    heatMapScaleInput = document.getElementById('heatMapScale'),
    heatMapMaxWidthInput = document.getElementById('heatMapMaxSize'),
    heatMapContext = heatMap.getContext("2d");

let mapStartX  = parseIntNaN(heatMapX.value);
let mapStartY = parseIntNaN(heatMapY.value);

class RatioGuess {
    constructor(width, height) {
        this._width = width;
        this._height = height;
    }
    get width() {
        return this._width;
    }
    set width(width) {
        this._width = width;
        this.calcRatio();
    }
    get height() {
        return this._height;
    }
    set height(height) {
        this._height = height;
        this.calcRatio();
    }

    get origWidth() {
        return this._origWidth;
    }
    set origWidth(width) {
        this._origWidth = width;
    }
    get origHeight() {
        return this._origHeight;
    }
    set origHeight(height) {
        this._origHeight = height;
    }

    get ratio() {
        return this._ratio;
    }
    calcRatio() {
        this._ratio = this._width / this._height;
    }
    baseGgt () {
        this.origHeight = this.height;
        this.origWidth = this.width;
        let a = this.width,
            b = this.height;
        while (b != 0) {
            let h = a % b;
            a = b;
            b = h;
        }
        this.width = this.width / a;
        this.height = this.height / a;
    }
}

let searchParams = new URLSearchParams(window.location.search);
if (searchParams.has('width')) {
    widthInput.value = parseInt(searchParams.get('width'));
}
if (searchParams.has('height')) {
    heightInput.value = parseInt(searchParams.get('height'));
}

let guess = new RatioGuess(widthInput.value, heightInput.value);
let refreshing = false;

function updateInputResult() {
    refreshing = true;
    ratioOut.innerHTML = "" + guess.ratio;
    ggtWidth.textContent = "" + guess.width;
    ggtHeight.textContent = "" + guess.height;
    width.value = guess.origWidth;
    height.value = guess.origHeight;
    heatMapX.value = mapStartX;
    heatMapY.value = mapStartY;
    refreshing = false;
}

function parseFloatNaN(value) {
    value = parseFloat(value);
    if (isNaN(value)) {
        return 0;
    }
    return value;
}

function parseIntNaN(value) {
    value = parseInt(value);
    if (isNaN(value)) {
        return 0;
    }
    return value;
}

function inputChange() {
    if (!refreshing) {
        let width = parseFloatNaN(widthInput.value),
            height = parseFloatNaN(heightInput.value);
        guess.width = Math.max(width, 1);
        guess.height = Math.max(height, 1);
        guess.baseGgt();
        selectedHeight = selectedWidth = selectedRatio = undefined;
        drawHeatMap();
        updateInputResult();
        updateSelection();
    }
}


function updateHeatMapScale () {
    heatMapScale = parseFloatNaN(heatMapScaleInput.value);
}
updateHeatMapScale();

function scaleLog(value, scale) {
    return 1 - (Math.log(value) / Math.log(scale * value));
}
function heatScale (heat) {
    let scaledHeat = scaleLog(heat, heatMapScale);
    return isNaN(scaledHeat) ? 0 : scaledHeat;
}

let maxRenderWidth = Math.max(1, parseIntNaN(heatMapMaxWidthInput.value));
    tileSize = 15;
function drawHeatMap() {
    let closestRadius = 1,
        closestRadiusHit = tileSize / 2,
        maxRenderHeight = maxRenderWidth;

    heatMapContext.clearRect(0, 0, heatMap.width, heatMap.height);
    

    let widthCeil = Math.ceil(guess.width),
        heightCeil = Math.ceil(guess.height);
    
    if (widthCeil === 0) {
        heatMapContainer.style.display = 'none';
        return;
    } else {
        heatMapContainer.style.display = 'block';
    }
    
    if (mapStartX === undefined || isNaN(mapStartX) || mapStartX < 1) {
        mapStartX = 1;
    }
    if (mapStartY === undefined || isNaN(mapStartY) || mapStartY < 1) {
        mapStartY = 1;
    }
    if (widthCeil > maxRenderWidth) {
        widthCeil = maxRenderWidth;
        heightCeil = Math.ceil(widthCeil * (1 / guess.ratio));
    }
    if (heightCeil > maxRenderHeight) {
        heightCeil = maxRenderHeight;
        widthCeil = Math.ceil(heightCeil * guess.ratio);
    }    

    heatMap.width = widthCeil * tileSize;
    heatMap.height = heightCeil * tileSize;
    heatMapContainer.style.width = heatMap.width + 'px';
    heatMapContainer.style.height = heatMap.height + 'px';
    
    for (let r = 0; r < heightCeil; r++) {
        let closest = 0,
        closestIndex = 0,
        y = r * tileSize;
        
        for (let c = 0; c < widthCeil; c++) {
            let x = c * tileSize,
                ratio = (mapStartX + c) / (mapStartY + r),
                heat = ratio > guess.ratio ? guess.ratio / ratio : ratio / guess.ratio;
            if (heat > closest) {
                closest = heat;
                closestIndex = c;
            }
            heatMapContext.fillStyle = 'hsl(' + ((1 - heatScale(heat)) * 240) + ', 100%, 50%)';
            heatMapContext.fillRect(x, y, tileSize, tileSize); 
        }
        // closest
        let x = closestIndex * tileSize;
        // black square on hit
        if (closest === 1) {
            heatMapContext.fillStyle = '#000';
            heatMapContext.fillRect(x, y, tileSize, tileSize); 
        }
        // circle in heat color
        heatMapContext.beginPath();
        heatMapContext.arc(x + (tileSize / 2), y + (tileSize / 2), closestRadius + ((closestRadiusHit - closestRadius) * scaleLog(closest, 0.999)), 0, 2 * Math.PI, false);
        heatMapContext.fillStyle = closest === 1 ? 'hsl(0, 100%, 50%)' : '#fff';
        heatMapContext.fill();
    };
}


widthInput.addEventListener('change', function() {
    inputChange();
});
heightInput.addEventListener('change', function() {
    inputChange();
});

heatMapX.addEventListener('change', function() {
    if (!refreshing) {
        mapStartX  = Math.max(1, parseIntNaN(heatMapX.value));
        drawHeatMap();
        updateHeatmapInput();
    }
});
heatMapY.addEventListener('change', function() {
    if (!refreshing) {
        mapStartY = Math.max(1, parseIntNaN(heatMapY.value));
        drawHeatMap();
        updateHeatmapInput();
    }
});
heatMapScaleInput.addEventListener('change', function() {
    if (!refreshing) {
        updateHeatMapScale();
        drawHeatMap();
        updateHeatmapInput();
    }
});
heatMapMaxWidthInput.addEventListener('change', function() {
    if (!refreshing) {
        maxRenderWidth = Math.min(1000, Math.max(1, parseIntNaN(heatMapMaxWidthInput.value)));
        drawHeatMap();
        updateHeatmapInput();
    }
});
function updateHeatmapInput() {
    refreshing = true;
    heatMapX.value = mapStartX;
    heatMapY.value = mapStartY;
    heatMapMaxWidthInput.value = maxRenderWidth;
    heatMapScaleInput.value = heatMapScale;
    refreshing = false;
}

// Overlay and Slection
// TODO select only on click

let overlay = document.getElementById('overlay'),
    overlayInfoBox = {
        width: document.getElementById('overlayWidth'),
        height: document.getElementById('overlayHeight'),
        ratio: document.getElementById('overlayRatio'),
        ratioDiff: document.getElementById('overlayRatioDiff'),
        heat: document.getElementById('overlayHeat'),
    },
    selectionInfoBox = {
        width: document.getElementById('selectionWidth'),
        height: document.getElementById('selectionHeight'),
        ratio: document.getElementById('selectionRatio'),
        ratioDiff: document.getElementById('selectionRatioDiff'),
    },
    overlayRectangle = document.getElementById('overlayRectangle'),
    selectionRectangle = document.getElementById('selectionRectangle'),
    overlayInfo = document.getElementById('overlayInfo'),
    inputWidth = document.getElementById('inputWidth'),
    inputHeight = document.getElementById('inputHeight'),
    resultHeight = document.getElementById('resultHeight'),
    resultWidth = document.getElementById('resultWidth'),
    resultHeightRnd = document.getElementById('resultHeightRnd'),
    resultWidthRnd = document.getElementById('resultWidthRnd'),
    resultHeightRndDiff = document.getElementById('resultHeightRndDiff'),
    resultHeightDiff = document.getElementById('resultHeightDiff'),
    resultWidthRndDiff = document.getElementById('resultWidthRndDiff'),
    resultWidthDiff = document.getElementById('resultWidthDiff'),
    selectionContainer = document.getElementById('selectionContainer'),
    resultContainer = document.getElementById('resultContainer'),
    selectedRatio = undefined,
    selectedWidth = undefined,
    selectedHeight = undefined,
    storedSelectedWidth = undefined
    storedSelectedHeight = undefined;

function updateOverlayInfo(x, y) {
    let mx = Math.ceil((x - heatMapContainer.offsetLeft - heatMap.offsetLeft) / tileSize),
        my = Math.ceil((y - heatMapContainer.offsetTop - heatMap.offsetTop) / tileSize);

    if (mx < 1) {
        mx = 1;
    }
    if (my < 1) {
        my = 1;
    }
    selectedWidth = mapStartX - 1 + mx;
    selectedHeight = mapStartY - 1 + my;
    selectedRatio = selectedWidth / selectedHeight;
    let width = (selectedWidth - mapStartX + 1) * tileSize,
        height = (selectedHeight - mapStartY + 1) * tileSize;
    applyInfo(overlayInfoBox);
    overlayRectangle.style.width = width + "px";
    overlayRectangle.style.height = height + "px";

    let transX = "0",
        transY = "0";
    if (overlayInfo.offsetWidth > width) {
        transX = "100%";
    }
    if (overlayInfo.offsetHeight > height) {
        transY = "100%";
    }
    overlayInfo.style.transform = 'translate3d(' + transX + ', ' + transY + ', 0)';
}

function updateSelection() {
    if (selectedWidth === undefined) {
        selectionContainer.style.display = 'none';
        selectionRectangle.style.display = 'none';
    } else {
        selectionContainer.style.display = 'block';
        applyInfo(selectionInfoBox);
    }
    updateResult();
    updateSelectStart();
}

function applyInfo(infoBox) {
    if (selectedWidth !== undefined && selectedHeight !== undefined) {
        if (infoBox.width) {    
            infoBox.width.textContent = "" + selectedWidth;
        }
        if (infoBox.height) {
            infoBox.height.textContent = "" + selectedHeight;
        }
        if (infoBox.ratio) {
            infoBox.ratio.textContent = "" + selectedRatio;
        }
        if (infoBox.ratioDiff) {
            infoBox.ratioDiff.textContent = "" + (selectedRatio - guess.ratio);
        }
        if (infoBox.heat) {
            infoBox.heat.textContent = "" + (heatScale(selectedRatio > guess.ratio ? guess.ratio / selectedRatio : selectedRatio / guess.ratio));
        }
    }
}
function updateResult() {
    if (selectedWidth === undefined) {
        resultContainer.style.display = 'none';
        return;
    }
    resultContainer.style.display = 'block';
    let resWidth = (guess.origHeight * selectedRatio),
        resHeight = (guess.origWidth * (1 / selectedRatio)),
        resWidthRnd = Math.round(resWidth),
        resHeightRnd = Math.round(resHeight);

    inputWidth.textContent = "" + guess.origWidth;
    inputHeight.textContent = "" + guess.origHeight;
    resultWidth.textContent = "" + resWidth;
    resultHeight.textContent = "" + resHeight;
    resultWidthRnd.textContent = "" + resWidthRnd;
    resultHeightRnd.textContent = "" + Math.round(resHeight);
    resultWidthDiff.textContent = "" + (resWidth - guess.origWidth);
    resultWidthRndDiff.textContent = "" + (resWidthRnd - guess.origWidth);
    resultHeightDiff.textContent = "" + (resHeight - guess.origHeight);
    resultHeightRndDiff.textContent = "" + (resHeightRnd - guess.origHeight);
}

heatMap.addEventListener('mouseenter', function(e) {
    overlay.style.display = "block";
});
heatMap.addEventListener('mouseleave', function(e) {
    overlay.style.display = "none";
});
heatMap.addEventListener('mousemove', function(e) {
    updateOverlayInfo(e.pageX, e.pageY);
});
heatMap.addEventListener('click', function(e) {
    updateSelection();
    storedSelectedWidth = selectedWidth;
    storedSelectedHeight = selectedHeight;
    
    if (storedSelectedWidth !== 0 || storedSelectedHeight !== 0) {
        selectionRectangle.style.display = 'block';
        selectionRectangle.style.width = ((storedSelectedWidth - mapStartX + 1) * tileSize) + 'px';
        selectionRectangle.style.height = ((storedSelectedHeight - mapStartY + 1) * tileSize) + 'px';
    } else {
        selectionRectangle.style.display = 'none';
    }
});

// rounding on/off
let res = document.getElementsByClassName('res');
let resRnd = document.getElementsByClassName('resRnd');

document.getElementById('roundResult').addEventListener('change', function(e) {
    if(e.target.checked) {
        for (let r = 0; r < res.length; r++) {
            res[r].style.display = 'none';
        }
        for (let r = 0; r < resRnd.length; r++) {
            resRnd[r].style.display = 'block';
        }
    } else {
        for (let r = 0; r < res.length; r++) {
            res[r].style.display = 'block';
        }
        for (let r = 0; r < resRnd.length; r++) {
            resRnd[r].style.display = 'none';
        }
    }
});

// select start on/of
function updateSelectStart () {
    if (selectedWidth === undefined) {
        selectStartContainer.style.display = 'none';
        return;
    }
    selectStartContainer.style.display = 'block';
}

document.getElementById('setStart').addEventListener('click', function(e) {
    mapStartFormSelection();
});

function mapStartFormSelection () {
    if (!refreshing) {
        mapStartX = storedSelectedWidth;
        mapStartY = storedSelectedHeight;
        inputChange();
    }
}

// init
inputChange();