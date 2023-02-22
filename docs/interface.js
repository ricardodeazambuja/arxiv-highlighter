"use strict";


const RECTCOLOURS = {'r':'red', 'g':"green", 'b':"blue", 'y':"yellow", 'o': "orange"};
const RECTCOLOURS_KEYS = Object.keys(RECTCOLOURS);
const DEFAULT_TOUCH_DELAY = 300;
const DEFAULT_ALPHA = 0.3;
const DEFAULT_INIT_PAGE = 1;
const DEFAULT_MIN_MOV = 0.01;
const DEFAULT_TEXT_SEARCH = true;

const main_title = document.getElementById('main_title');
const usage_help = document.getElementById('usage_help');
const container = document.getElementById("container");

const next_page = document.getElementById('next_page');
const next_page_div = document.getElementById('next_page_div');
const prev_page = document.getElementById('prev_page');
const prev_page_div = document.getElementById('prev_page_div');

const canvas_annotation = document.getElementById("canvas_annotation");
const canvas = document.getElementById("canvas_page");
const context = canvas.getContext("2d");

const textLayer = document.getElementById("svg_container");
textLayer.style.position = "absolute";
textLayer.style.zIndex = -1;

canvas.style.position = "absolute";
canvas.style.zIndex = "-1";
canvas.style.top = "0";
canvas.style.left = "0";
canvas.style.margin = "0";
canvas.style.padding =  "0px";

canvas_annotation.style.position = "absolute";
canvas_annotation.style.zIndex = 9999;
canvas_annotation.style.top = canvas.style.top;
canvas_annotation.style.left = canvas.style.left;
canvas_annotation.style.margin = canvas.style.margin;
canvas_annotation.style.padding = canvas.style.padding;

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.3.122/pdf.worker.min.js`;
// pdfjsLib.GlobalWorkerOptions.workerSrc = "pdf.worker.min.js";

const PDFHighlighterApplication = {
    pdfLoadingTask: null,
    pdfDocument: null,
    pdfURL: null,
    URL: null,
    baseURL: null,
    origin: null,
    final: null,
    urlCompressedData: null,
    activeCanvases: [],
    canvasLayer: 0,
    next_color: 0,
    
    touchstartTime: 0,
    touchId: null,
    drawing: false,
    outputScale: 1,
    touchholdDelay: null,
    changeColor: false,
    
    currPage: 1,
    total_pages: 0,

    alpha: null,
    hashChanged: false,
    

updateURL(note=null, removeIdx=-1){
    var finalURL = this.baseURL;
    const alpha = (this.alpha != DEFAULT_ALPHA) ? this.alpha : null;
    const touchholdDelay = (this.touchholdDelay != DEFAULT_TOUCH_DELAY) ? this.touchholdDelay : null;
    const currPage = (this.currPage != DEFAULT_INIT_PAGE) ? this.currPage : null;
    const search = (this.search != DEFAULT_TEXT_SEARCH) ? this.search : null;

    finalURL += "#url=" + this.URL;
    if (alpha)
        finalURL += "&alpha=" + alpha;
    if (touchholdDelay)
        finalURL += "&delay=" + touchholdDelay;
    if (search!=null)
        finalURL += "&search=" + search;
    if (currPage)
        finalURL += "&page=" + currPage;
    
    var urlAddition = [];
    if ((note!=null) && (removeIdx==-1)){
        urlAddition = [this.currPage + "," +
                       canvas_annotation.style.borderColor[0] + "," +
                       this.origin.x + "," +
                       this.origin.y + "," +
                       this.final.x  + "," +
                       this.final.y  + "," +
                       `${note}`];
    }

    var dataFromUrl = [];
    if (!!this.urlCompressedData){
        dataFromUrl = LZString.decompressFromEncodedURIComponent(this.urlCompressedData).split("&");
        if (removeIdx!=-1){
            let activeRectangle = 0
            for (let i of dataFromUrl.keys()){
                if (dataFromUrl[i][0]==this.currPage){
                    if (activeRectangle==removeIdx){
                        if (note==null){
                            dataFromUrl.splice(i,1);
                        } else {
                            let tmp_data = dataFromUrl[i].split(',');
                            tmp_data[6] = note;
                            dataFromUrl[i] = tmp_data;
                        }
                        break;
                    }
                    activeRectangle++;
                }
            }
        }
    }

    dataFromUrl = dataFromUrl.concat(urlAddition);

    this.urlCompressedData = LZString.compressToEncodedURIComponent(dataFromUrl.join("&"));
    if (this.urlCompressedData!='Q')
        finalURL += "&cdata="+this.urlCompressedData;
    
    window.history.pushState("", document.title, finalURL);  
},

checkHoverCanvas(x, y){
    let topCanvas = null;
    for(let tmp_canvas of this.activeCanvases){
        const tmp_ctx = tmp_canvas.getContext("2d");
        if (tmp_ctx.isPointInPath(tmp_ctx.path, x, y)){
            if (topCanvas){
                if (tmp_canvas.zIndex > topCanvas.zIndex){
                    topCanvas = tmp_canvas;
                }
            } else {
                topCanvas = tmp_canvas;
            }
        }
    }
    if (topCanvas) {
        return topCanvas;
    } else {
        return;
    }
},

canvasBuilder(create=true){
    if (create==true){
        this.canvasLayer += 1;
        const tmp_canvas = document.createElement("canvas");
        this.activeCanvases.push(tmp_canvas);
        tmp_canvas.setAttribute("id", "canvas_" + String(this.canvasLayer).padStart(3, '0'));
        container.appendChild(tmp_canvas);
        tmp_canvas.width = canvas.width;
        tmp_canvas.height = canvas.height;
        tmp_canvas.style.width = canvas.style.width;
        tmp_canvas.style.height = canvas.style.height;
        tmp_canvas.style.position = "absolute";
        tmp_canvas.style.zIndex = this.canvasLayer;
        tmp_canvas.style.top = canvas.style.top;
        tmp_canvas.style.left = canvas.style.left;
        tmp_canvas.style.margin = canvas.style.margin;
        tmp_canvas.style.padding =  canvas.style.padding;
        tmp_canvas.style.border = canvas.style.border;
        console.log("Creating canvas number: " + this.canvasLayer);
        return tmp_canvas.getContext("2d");    
    } else if (create=='clean'){
        for(let tmp_canvas of this.activeCanvases){
            tmp_canvas.remove();    
        }
        this.activeCanvases = [];
    } else {
        console.log("Deleting canvas number: " + this.canvasLayer);
        const tmp_canvas = this.activeCanvases.pop();
        tmp_canvas.remove();
        this.canvasLayer -= 1;
    }
},

drawRectangle(tmp_context, rectCoord){
    const tmp_path = new Path2D();
    tmp_path.rect(rectCoord[0], rectCoord[1], rectCoord[2], rectCoord[3]);
    tmp_context.fill(tmp_path);
    tmp_context.path = tmp_path;
},

loadRectangles(){
    var rectangles = []
    if (!!this.urlCompressedData)
        rectangles = LZString.decompressFromEncodedURIComponent(this.urlCompressedData).split("&");

    for(let i of rectangles.keys()){
      const rectangle = rectangles[i].split(',');
      const page_num = parseInt(rectangle[0]);
      if (page_num == this.currPage){
        let tmp_context = this.canvasBuilder();

        const tmp_color = RECTCOLOURS[rectangle[1]];
        tmp_context.globalAlpha = this.alpha;
        tmp_context.fillStyle = tmp_color;
        const rect_values =  rectangle.slice(2,6).map(Number);
        const rectCoord = [canvas.width*rect_values[0], 
                           canvas.height*rect_values[1], 
                           canvas.width*(rect_values[2] - rect_values[0]), 
                           canvas.height*(rect_values[3] - rect_values[1])];
        this.drawRectangle(tmp_context, rectCoord);
        const note = rectangle.slice(6);
        tmp_context.canvas.note = note ? note : "";
        console.log("Color: " + tmp_color + " - " + "Values: " + rect_values + " - " + "Note: " + tmp_context.canvas.note);
      }
    }
},

getFromUrl(){
    this.baseURL = window.location.origin + new URL(window.location.href).pathname;
    const urlParams = new URLSearchParams("?"+window.location.hash.slice(1));
    this.URL = urlParams.get('url');
    if (this.URL){
        if (this.URL.search("arxiv.org")!=-1 && this.URL.search("abs")!=-1){
            this.pdfURL = this.URL.replace("abs","pdf")+".pdf";
        } else {
            this.pdfURL = this.URL;
        }
        console.log("Found pdfURL: " + this.pdfURL);
    } else {
        main_title.textContent = "Missing url!";
        usage_help.style.display = "block";
        if (window.location.hash==''){
            this.hashChanged = true;
            window.location.hash="url="; // trying to make it more user friendly...
        }
        console.log("Missing url!");
        return -1;
    }

    this.currPage = urlParams.getAll('page')[0];
    if (!this.currPage){
        this.currPage = DEFAULT_INIT_PAGE;
    }

    this.alpha = urlParams.getAll('alpha')[0];
    if (!this.alpha){
        this.alpha = DEFAULT_ALPHA;
    }

    this.search = urlParams.getAll('search')[0];
    if (this.search==null){
        this.search = DEFAULT_TEXT_SEARCH;
    } else {
        this.search = this.search == 'true';
    }

    this.touchholdDelay = urlParams.getAll('delay')[0];
    if (!this.touchholdDelay){
        this.touchholdDelay = DEFAULT_TOUCH_DELAY;
    }

    this.urlCompressedData = urlParams.getAll('cdata')[0];
},

updatePageHash(pageNum){
    var tmp_hash;
    const urlParams = new URLSearchParams("?"+window.location.hash.slice(1));
    const tmp_page = urlParams.getAll('page')[0];
    if (tmp_page){
        tmp_hash = window.location.hash.replace(/\&page=\d*/gm, `&page=${pageNum}`);
    } else if (window.location.hash.search(".pdf")!=-1) {
        tmp_hash = window.location.hash.replace(".pdf", `.pdf&page=${pageNum}`);
    } else if (window.location.hash.search(/\d{4}.\d{5}/g)!=-1) {
        tmp_hash = window.location.hash.replace(/\d{4}.\d{5}/g, `$&&page=${pageNum}`);
    } else {
        alert("Problem with the URL formatting, I can't add the page number to it :(");
        return;
    }
    this.hashChanged = true;
    window.location.hash = tmp_hash;
},

setGeneralListeners(){
    const self = this;

    prev_page.addEventListener('click', function() {
        if (self.currPage == 1){
            console.log("Reached first page!");
            return;
        }
        self.currPage--;
        self.updatePageHash(self.currPage);
        self.load();
    }, false);


    next_page.addEventListener('click', function() {
        if (self.currPage == self.total_pages){
            console.log("Reached last page!");
            return;
        }
        self.currPage++;
        self.updatePageHash(self.currPage);
        self.load();
    }, false);

},

setTouchInterface(){
    const self = this;
    var tmp_annotation;
    var offsetX = null;
    var offsetY = null;
    console.log("Touch detected...");
    canvas_annotation.addEventListener('touchstart', function(e) {
        if(e.touches.length == 1) {
            self.touchstartTime = new Date().getTime();
            offsetX = self.outputScale*e.touches[0].pageX - 20; //10px border
            offsetY = self.outputScale*e.touches[0].pageY - 20; //10px border
            self.origin = {x: offsetX/canvas.width, y: offsetY/canvas.height};
            console.log("Touch start!")
        } else if (e.touches.length == 2) {
            const offsetX = self.outputScale*e.touches[0].pageX - 20; //10px border
            const offsetY = self.outputScale*e.touches[0].pageY - 20; //10px border
            const tmp_canvas = self.checkHoverCanvas(offsetX, offsetY);
            if (tmp_canvas) {
                for(let i of self.activeCanvases.keys()){
                    if(tmp_canvas==self.activeCanvases[i]){
                        console.log("Removing canvas index: " + i);
                        tmp_canvas.remove();
                        self.activeCanvases.splice(i, 1);
                        self.updateURL(null, i);
                        break;
                    }
                }
            } else {
                self.changeColor = true;
            }
        }
    }, false);

    canvas_annotation.addEventListener('touchmove', function(e) {
        if (e.touches.length == 2) {
            self.changeColor = false; // avoid changing color during zoom
        } else if(self.touchstartTime > 0) {
            if (((new Date().getTime()) - self.touchstartTime ) > self.touchholdDelay){
                e.preventDefault();
                self.touchstartTime = 0;
                self.drawing = true;
                tmp_annotation = self.canvasBuilder();
                console.log("Starting rectangle...");
            } else {
                console.log("False alarm, no rectangle...");
                self.touchstartTime = 0; // to prevent starting while scrolling, etc
                self.drawing = false;
            }
        } else if (self.drawing) {
            e.preventDefault();
            if (!!self.origin) { 
                if (!!self.final) { 
                    tmp_annotation.clearRect(0, 0, canvas.width, canvas.height);
                }
                tmp_annotation.globalAlpha = self.alpha;
                tmp_annotation.fillStyle = canvas_annotation.style.borderColor;
                const offsetX = self.outputScale*e.touches[0].pageX - 20; //10px border
                const offsetY = self.outputScale*e.touches[0].pageY - 20; //10px border
                self.final = {x: offsetX/canvas.width, y: offsetY/canvas.height};
                const rect_values = [canvas.width*self.origin.x, 
                                     canvas.height*self.origin.y, 
                                     canvas.width*(self.final.x - self.origin.x), 
                                     canvas.height*(self.final.y - self.origin.y)];
                self.drawRectangle(tmp_annotation, rect_values);

            }
        }
    }, false);

    canvas_annotation.addEventListener('touchend', function(e) {
        console.log("Touch end!")
        if (self.changeColor) {
            self.changeColor = false;
            self.next_color++;
            const tmp_key = RECTCOLOURS_KEYS[(self.next_color % RECTCOLOURS_KEYS.length + RECTCOLOURS_KEYS.length) % RECTCOLOURS_KEYS.length];
            canvas_annotation.style.borderColor = RECTCOLOURS[tmp_key];
            console.log("Color changed to " + RECTCOLOURS[tmp_key]);
        } else if (self.drawing){
            e.preventDefault();
            if (!!self.final) {
                const delayedPrompt = () => {
                    const note = prompt("Add note?", "")
                    tmp_annotation.canvas.note = note ? note : "";
                    self.updateURL(tmp_annotation.canvas.note, -1);
                    self.origin = null; 
                    self.final = null; 
                };
                setTimeout(delayedPrompt, 10);
            } else {
                // delete canvas
                console.log("No rectangle, delete canvas!")
                self.canvasBuilder(false);
            }
        } else {
            if (offsetX){
                const tmp_canvas = self.checkHoverCanvas(offsetX, offsetY);
                if (tmp_canvas){
                    const delayedAlert = () => {
                        let i;
                        for(i of self.activeCanvases.keys()){
                            if(tmp_canvas==self.activeCanvases[i]){
                                console.log("Updating canvas index: " + i);
                                break;
                            }
                        }
                        const note = prompt(tmp_canvas.note, tmp_canvas.note);
                        if (tmp_canvas.note!=note && note!=null){
                            self.activeCanvases[i].note = note;
                            self.updateURL(note, i);
                        }
                    };    
                    setTimeout(delayedAlert, 10);
                }    
            }
        }
        offsetX = offsetY = null;
        self.drawing = false;
    }, false);
},

setMouseInterface(){
    const self = this;
    var tmp_annotation;
    console.log("Mouse detected...");
    canvas_annotation.addEventListener('mousedown', function(e) {
        if (e.button==0){
            self.origin = {x: e.offsetX/canvas.width, y: e.offsetY/canvas.height}; 
            tmp_annotation = self.canvasBuilder();
        }else if(e.button==2){
            const tmp_canvas = self.checkHoverCanvas(e.offsetX, e.offsetY);
            if (tmp_canvas) {
                for(let i of self.activeCanvases.keys()){
                    if(tmp_canvas==self.activeCanvases[i]){
                        console.log("Removing canvas index:", i);
                        tmp_canvas.remove();
                        self.activeCanvases.splice(i, 1);
                        self.updateURL(null, i);
                        break;
                    }
                }
            } else {
                //change color
                self.next_color++;
                const tmp_key = RECTCOLOURS_KEYS[(self.next_color % RECTCOLOURS_KEYS.length + RECTCOLOURS_KEYS.length) % RECTCOLOURS_KEYS.length];
                canvas_annotation.style.borderColor = RECTCOLOURS[tmp_key];
                console.log("Color changed to " + RECTCOLOURS[tmp_key]);
            }
        }
    }, false);

    canvas_annotation.addEventListener('mousemove', function(e) {
        if (e.button!=0) return;
        if (!!self.origin) { 
            if (!!self.final) { 
                tmp_annotation.clearRect(0, 0, canvas.width, canvas.height);
            }            
            tmp_annotation.globalAlpha = self.alpha;
            tmp_annotation.fillStyle = canvas_annotation.style.borderColor;
            self.final = {x: e.offsetX/canvas.width, y: e.offsetY/canvas.height};
            if ((Math.abs(self.final.x-self.origin.x) < DEFAULT_MIN_MOV) && 
                (Math.abs(self.final.y-self.origin.y) < DEFAULT_MIN_MOV)) {
                self.final = null;
                return;
            }
            const rect_values = [canvas.width*self.origin.x, 
                                 canvas.height*self.origin.y, 
                                 canvas.width*(self.final.x - self.origin.x), 
                                 canvas.height*(self.final.y - self.origin.y)];
            self.drawRectangle(tmp_annotation, rect_values);
        } 
    }, false);

    canvas_annotation.addEventListener('mouseup', function(e) {
        if (e.button!=0) return;
        if (!!self.final) {
            const delayedPrompt = () => {
                const note = prompt("Add note?", "")
                tmp_annotation.canvas.note = note ? note : "";
                self.updateURL(tmp_annotation.canvas.note,-1);
                self.origin = null; 
                self.final = null; 
            };
            setTimeout(delayedPrompt, 10);
        } else if (!!self.origin) {
            // delete canvas
            console.log("No rectangle, delete canvas!")
            self.canvasBuilder(false);

            const tmp_canvas = self.checkHoverCanvas(e.offsetX, e.offsetY);
            if (tmp_canvas){
                const delayedAlert = () => {
                    let i;
                    for(i of self.activeCanvases.keys()){
                        if(tmp_canvas==self.activeCanvases[i]){
                            console.log("Updating canvas index: " + i);
                            break;
                        }
                    }
                    const note = prompt(tmp_canvas.note, tmp_canvas.note);
                    if (tmp_canvas.note!=note && note!=null){
                        self.activeCanvases[i].note = note;
                        self.updateURL(note, i);
                    }
                };
                setTimeout(delayedAlert, 10);
            }
            self.origin = null; 
        }
    }, false);
},

close() {
    // const errorWrapper = document.getElementById("errorWrapper");
    // errorWrapper.hidden = true;

    if (!this.pdfLoadingTask) {
      return Promise.resolve();
    }

    const promise = this.pdfLoadingTask.destroy();
    this.pdfLoadingTask = null;

    if (this.pdfDocument) {
      this.pdfDocument = null;
    }
    return promise;
  },

open() {
    const self = this;
    if (this.pdfLoadingTask) {
        // We need to destroy already opened document
        return this.close().then(
          function () {
            // ... and repeat the open() call.
            return this.open();
          }.bind(this)
        );
    }

    if (this.getFromUrl()==-1)
        return;

    const loadingTask = pdfjsLib.getDocument(this.pdfURL);

    this.pdfLoadingTask = loadingTask;

    loadingTask.onProgress = function (progressData) {
      main_title.textContent = `Loading pdf (${parseInt(100*(progressData.loaded / progressData.total))}%)`;
      main_title.textContent += ` - received ${progressData.loaded} of ${progressData.total} bytes`;
    };

    return loadingTask.promise.then(
        function(pdfDocument){
            self.setGeneralListeners();

            // https://stackoverflow.com/a/48579537/7658422
            if (window.matchMedia('(hover: hover), (any-hover: hover), (-moz-touch-enabled: 0)').matches) {
                self.setMouseInterface();
            } else {
                self.setTouchInterface();
            }

            self.pdfDocument = pdfDocument;
            self.load();
        },
        function (exception) {
          const message = exception && exception.message;
          main_title.style.display = "block";
          usage_help.style.display = "block";
          main_title.textContent = message;
          console.log(message);
        }
    );
},
load(){
    const self = this;
    //
    // Fetch the page
    //
    main_title.style.display = "block";
    usage_help.style.display = "none";
    textLayer.style.display = "none";
    canvas.style.display = "none";
    canvas_annotation.style.display = "none";
    prev_page_div.style.display = "none";
    next_page_div.style.display = "none";
    this.canvasBuilder('clean');
    try {
        self.pdfDocument.getPage(parseInt(self.currPage)).then(
            function(page){
                var desiredWidth = container.clientWidth - canvas.style.border.split(" ")[0].slice(0,-2)*2;
                var viewport = page.getViewport({ scale: 1, });
                var scale = desiredWidth / viewport.width;
                viewport = page.getViewport({ scale: scale, });

                // Support HiDPI-screens.
                self.outputScale = window.devicePixelRatio || 1;

                //
                // Prepare canvas using PDF page dimensions
                //
                canvas.width = Math.floor(viewport.width * self.outputScale);
                canvas.height = Math.floor(viewport.height * self.outputScale);
                canvas.style.width = Math.floor(viewport.width) + "px";
                canvas.style.height = Math.floor(viewport.height) + "px";

                canvas_annotation.width = canvas.width;
                canvas_annotation.height = canvas.height;
                canvas_annotation.style.width = canvas.style.width;
                canvas_annotation.style.height = canvas.style.height;
                canvas_annotation.style.left = canvas.style.left

                const transform = self.outputScale !== 1 ? [self.outputScale, 0, 0, self.outputScale, 0, 0] : null;

                //
                // Render PDF page into canvas context
                //
                const renderContext = {
                                        canvasContext: context,
                                        transform,
                                        viewport,
                                    };
                main_title.textContent = "Rendering...";
                self.renderTask = true;
                const renderTask = page.render(renderContext);
                renderTask.promise.then(function() {
                }).then(function() {
                    self.loadRectangles();
                    main_title.style.display = "none";
                    canvas.style.display = "block";
                    canvas_annotation.style.display = "block";
                    prev_page_div.style.display = "block";
                    next_page_div.style.display = "block";

                    if (self.search){
                        main_title.textContent = "Recovering text...";
                        return page.getTextContent();    
                    } else {
                        return;
                    }
                }).then(function(textContent) {
                    main_title.textContent = "Almost there...";
                    if (!!textContent){
                        // building SVG and adding that to the DOM
                        const svg = buildSVG(viewport, textContent);
                        const prevSVG = document.getElementById("svg_text");
                        if (prevSVG){
                            prevSVG.remove();
                        }
                        textLayer.append(svg);
                        textLayer.style.display = "block";
                    }
                    // Release page resources.
                    page.cleanup();
                });
            },
            function (exception) {
                const message = exception && exception.message;
                main_title.style.display = "block";
                usage_help.style.display = "block";
                main_title.textContent = message;
                console.log(message);
                }
        );
        self.total_pages = self.pdfDocument.numPages;
    } catch (e){
        main_title.textContent = `${e} (Page ${self.currPage})`;
        main_title.style.display = "block";
        usage_help.style.display = "block";
        console.log(e);
        return;
    }
}
};

window.PDFHighlighterApplication = PDFHighlighterApplication;

// This allows the use of back/forward to undo/redo things
window.addEventListener('popstate', function(e) {
    if (PDFHighlighterApplication.hashChanged){
        PDFHighlighterApplication.hashChanged = false;
        return;
    } else {
        location.reload(); // easier (url will be updated) than manipulating the canvas...
    }
}, false);

// waiting for first animation.
const animationStarted = new Promise(function (resolve) {
    window.requestAnimationFrame(resolve);
});

// We need to delay opening until all HTML is loaded.
animationStarted.then(function () {
    main_title.textContent += "done! Now preparing to load the pdf...";
    PDFHighlighterApplication.open();
});

// https://github.com/mozilla/pdf.js/blob/546902df63b4fcfad419bc8109d128040d7b27ab/examples/text-only/pdf2svg.js
function buildSVG(viewport, textContent) {
    const SVG_NS = "http://www.w3.org/2000/svg";
    // Building SVG with size of the viewport (for simplicity)
    const svg = document.createElementNS(SVG_NS, "svg:svg");
    svg.setAttribute("width", viewport.width + "px");
    svg.setAttribute("height", viewport.height + "px");
    // items are transformed to have 1px font size
    svg.setAttribute("font-size", 1);
  
    // processing all items
    textContent.items.forEach(function (textItem) {
      // we have to take in account viewport transform, which includes scale,
      // rotation and Y-axis flip, and not forgetting to flip text.
      const tx = pdfjsLib.Util.transform(
        pdfjsLib.Util.transform(viewport.transform, textItem.transform),
        [1, 0, 0, -1, 0, 0]
      );
      const style = textContent.styles[textItem.fontName];
      // adding text element
      const text = document.createElementNS(SVG_NS, "svg:text");
      text.setAttribute("transform", "matrix(" + tx.join(" ") + ")");
      text.setAttribute("font-family", style.fontFamily);
      text.setAttribute("fill", "rgba(100%, 100%, 100%, 0.0)");
      // text.setAttribute("opacity", 0.1);
      text.textContent = textItem.str;
      svg.setAttribute("id", "svg_text");
      svg.append(text);
    });
    return svg;
  }