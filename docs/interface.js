"use strict";


const RECTCOLOURS = {'r':'red', 'g':"green", 'b':"blue", 'y':"yellow", 'o': "orange"};
const RECTCOLOURS_KEYS = Object.keys(RECTCOLOURS);
const DEFAULT_TOUCH_DELAY = 300;
const DEFAULT_ALPHA = 0.3;
const DEFAULT_INIT_PAGE = 1;

const main_title = document.getElementById('main_title');
const container = document.getElementById("container");

const next_page = document.getElementById('next_page');
const next_page_div = document.getElementById('next_page_div');
const prev_page = document.getElementById('prev_page');
const prev_page_div = document.getElementById('prev_page_div');

const canvas_annotation = document.getElementById("canvas_annotation");
const canvas = document.getElementById("canvas_page");
const context = canvas.getContext("2d");
context.canvas.hidden = true;

canvas.style.position="absolute";
canvas.style.zIndex="-1";
canvas.style.top = "0";
canvas.style.left = "0";
canvas.style.margin = "0";
canvas.style.padding =  "0px";

canvas_annotation.style.position="absolute";
canvas_annotation.style.zIndex=9999;
canvas_annotation.style.top = canvas.style.top;
canvas_annotation.style.left = canvas.style.left;
canvas_annotation.style.margin = canvas.style.margin;
canvas_annotation.style.padding = canvas.style.padding;

const PDFHighlighterApplication = {
    pdfLoadingTask: null,
    pdfDocument: null,
    origin: null,
    final: null,
    allRectangles: [],
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
    

createNewCanvas(){
    this.canvasLayer += 1;
    const tmp_canvas = document.createElement("canvas");
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
},


loadRectangles(rectangles){
    let tmp_context = this.createNewCanvas();
    for(let rectangle of rectangles){
      const page_num = parseInt(rectangle.split(',')[0]);
      if (page_num == this.currPage){
        const tmp_color = RECTCOLOURS[rectangle.split(',')[1]];
        tmp_context.globalAlpha = this.alpha;
        tmp_context.fillStyle = tmp_color;
        const rect_values =  rectangle.split(',').slice(2,6).map(Number);
        tmp_context.beginPath();
        tmp_context.fillRect(canvas.width*rect_values[0], canvas.height*rect_values[1], 
                             canvas.width*(rect_values[2] - rect_values[0]), canvas.height*(rect_values[3] - rect_values[1])); 
        tmp_context.stroke();
        console.log("Color: " + tmp_color + " - " + "Values: " + rect_values);
      }
    }
},

getFromUrl(){
    const urlParams = new URLSearchParams(window.location.search);
    const url = urlParams.get('url');
    if (url){
        console.log("Found url: " + url);
    } else {
        main_title.textContent = "Missing url!";
        console.log("Missing url!");
        return;
    }

    this.currPage = urlParams.getAll('page')[0];
    if (!this.currPage){
        this.currPage = DEFAULT_INIT_PAGE;
    }

    this.alpha = urlParams.getAll('alpha')[0];
    if (!this.alpha){
        this.alpha = DEFAULT_ALPHA;
    }

    this.touchholdDelay = urlParams.getAll('delay')[0];
    if (!this.touchholdDelay){
        this.touchholdDelay = DEFAULT_TOUCH_DELAY;
    }

    this.allRectangles = urlParams.getAll('rect') ? urlParams.getAll('rect') : [];

    return url;
},


setListeners(){
    const self = this;
    // This allows the use of back/forward to undo/redo things
    window.addEventListener('popstate', function() {
        location.reload(); // easier (url will be updated) than manipulating the canvas...
    }, false);

    prev_page.addEventListener('click', function() {
        if (self.currPage == 1){
            console.log("Reached first page!");
            return;
        }
        var tmp_href;
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const tmp_page = urlParams.getAll('page')[0];
        if (tmp_page){
            tmp_href = window.location.href.replace(/\bpage=\b\d*/, `page=${parseInt(tmp_page)-1}`);
        } else {
            tmp_href = window.location.href.replace(/\bpdf\b/, `pdf&page=${parseInt(self.currPage)-1}`);
        }
        window.history.pushState("", document.title, tmp_href);
        location.reload();
    }, false);


    next_page.addEventListener('click', function() {
        if (self.currPage == self.total_pages){
            console.log("Reached last page!");
            return;
        }
        var tmp_href;
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const tmp_page = urlParams.getAll('page')[0];
        if (tmp_page){
            tmp_href = window.location.href.replace(/\bpage=\b\d*/, `page=${parseInt(tmp_page)+1}`);
        } else {
            tmp_href = window.location.href.replace(/\bpdf\b/, `pdf&page=${parseInt(self.currPage)+1}`);
        }
        window.history.pushState("", document.title, tmp_href);
        location.reload();
    }, false);

},

setTouchInterface(){
    const self = this;
    console.log("Touch detected...");
    canvas_annotation.addEventListener('touchstart', function(e) {
        if(e.touches.length == 1) {
            touchstartTime = new Date().getTime();
            touchId = e.touches[0].touchId;
            const offsetX = outputScale*e.touches[0].pageX - 20; //10px border
            const offsetY = outputScale*e.touches[0].pageY - 20; //10px border
            self.origin = {x: offsetX/canvas.width, y: offsetY/canvas.height};
            console.log("Touch start!")
        } else if (e.touches.length == 2) {
            changeColor = true;
        }
    }, false);

    canvas_annotation.addEventListener('touchmove', function(e) {
        var tmp_annotation;
        if (e.touches.length == 2) {
            changeColor = false; // avoid changing color during zoom
        }

        if(e.touches.length == 1 && touchstartTime > 0 && touchId == e.touches[0].touchId) {
            if (((new Date().getTime()) - touchstartTime ) > touchholdDelay){
                e.preventDefault();
                touchstartTime = 0;
                drawing = true;
                tmp_annotation = self.createNewCanvas();
                console.log("Starting rectangle...");
            } else {
                touchstartTime = 0; // to prevent starting while scrolling, etc
            }
        }
        if (drawing) {
            e.preventDefault();
            if (!!self.origin) { 
                if (!!self.final) { 
                    tmp_annotation.clearRect(0, 0, canvas.width, canvas.height);
                }
                tmp_annotation.globalAlpha = alpha;
                tmp_annotation.fillStyle = canvas_annotation.style.borderColor;
                const offsetX = outputScale*e.touches[0].pageX - 20; //10px border
                const offsetY = outputScale*e.touches[0].pageY - 20; //10px border
                self.final = {x: offsetX/canvas.width, y: offsetY/canvas.height}; 
                tmp_annotation.beginPath();
                tmp_annotation.fillRect(canvas.width*self.origin.x, canvas.height*self.origin.y, 
                                        canvas.width*(self.final.x - self.origin.x), canvas.height*(self.final.y - self.origin.y)); 
                tmp_annotation.stroke(); 
            }
        }
    }, false);

    canvas_annotation.addEventListener('touchend', function(e) {
        if (changeColor) {
            changeColor = false;
            //change color
            self.next_color++;
            const tmp_key = RECTCOLOURS_KEYS[(self.next_color % RECTCOLOURS_KEYS.length + RECTCOLOURS_KEYS.length) % RECTCOLOURS_KEYS.length];
            canvas_annotation.style.borderColor = RECTCOLOURS[tmp_key];
            console.log("Color changed to " + RECTCOLOURS[tmp_key]);
        }

        if (drawing){
            e.preventDefault();
            if (!!self.final) { 
                window.history.pushState("", document.title, window.location.href + "&rect=" +
                                                                self.currPage + "," +
                                                                canvas_annotation.style.borderColor[0] + "," +
                                                                self.origin.x.toFixed(2) + "," +
                                                                self.origin.y.toFixed(2) + "," +
                                                                self.final.x.toFixed(2)  + "," +
                                                                self.final.y.toFixed(2) + ""
                                                                );
            }
            self.origin = null; 
            self.final = null; 
            drawing = false;
            console.log("Rectangle finished!");
        }
    }, false);
},

setMouseInterface(){
    const self = this;
    var tmp_annotation;
    console.log("Mouse detected...");
    canvas_annotation.addEventListener('mousedown', function(e) {
      if (e.button==0){
          self.origin = {x: e.offsetX/canvas.width, y: e.offsetY/canvas.height}; 
          tmp_annotation = self.createNewCanvas();
      }else if(e.button==2){
          //change color
          self.next_color++;
          const tmp_key = RECTCOLOURS_KEYS[(self.next_color % RECTCOLOURS_KEYS.length + RECTCOLOURS_KEYS.length) % RECTCOLOURS_KEYS.length];
          canvas_annotation.style.borderColor = RECTCOLOURS[tmp_key];
          console.log("Color changed to " + RECTCOLOURS[tmp_key]);
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
                tmp_annotation.beginPath();
                tmp_annotation.fillRect(canvas.width*self.origin.x, 
                                        canvas.height*self.origin.y, 
                                        canvas.width*(self.final.x - self.origin.x), 
                                        canvas.height*(self.final.y - self.origin.y)); 
                tmp_annotation.stroke(); 
        } 
    }, false);

    window.addEventListener('mouseup', function(e) {
        if (e.button!=0) return;
        if (!!self.final) {
            window.history.pushState("", document.title, window.location.href + "&rect=" +
                                                                self.currPage + "," +
                                                                canvas_annotation.style.borderColor[0] + "," +
                                                                self.origin.x.toFixed(2) + "," +
                                                                self.origin.y.toFixed(2) + "," +
                                                                self.final.x.toFixed(2)  + "," +
                                                                self.final.y.toFixed(2)
                                                                );
        }
        self.origin = null; 
        self.final = null; 
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

    const url = this.getFromUrl();
    const loadingTask = pdfjsLib.getDocument(url);

    this.pdfLoadingTask = loadingTask;

    loadingTask.onProgress = function (progressData) {
      main_title.textContent = `Loading pdf (${parseInt(100*(progressData.loaded / progressData.total))}%)`;
      main_title.textContent += ` - received ${progressData.loaded} of ${progressData.total} bytes`;
    };

    return loadingTask.promise.then(
        function (pdfDocument) {
            //
            // Fetch the page
            //
            try {
                pdfDocument.getPage(parseInt(self.currPage)).then(
                    function(page){
                        main_title.style.display = "none";
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
                        page.render(renderContext);
                        context.canvas.hidden = false;
                        canvas.style.display = "block";
                        canvas_annotation.style.display = "block";
                        prev_page_div.style.display = "block";
                        next_page_div.style.display = "block";

                        self.setListeners();

                        if (self.allRectangles.length){
                            self.loadRectangles(self.allRectangles);
                        }

                        // https://stackoverflow.com/a/48579537/7658422
                        if (window.matchMedia('(hover: hover), (any-hover: hover), (-moz-touch-enabled: 0)').matches) {
                            self.setMouseInterface();
                        } else {
                            self.setTouchInterface();
                        }
                    },
                    function (exception) {
                        const message = exception && exception.message;
                        main_title.style.display = "block";
                        main_title.textContent = message;
                        console.log(message);
                      }
                );
                self.total_pages = pdfDocument.numPages;
            } catch (e){
                main_title.textContent = `${e} (Page ${self.currPage})`;
                main_title.style.display = "block";
                console.log(e);
                return;
            }
        },
        function (exception) {
          const message = exception && exception.message;
          main_title.style.display = "block";
          main_title.textContent = message;
          console.log(message);
        }
    );
}
};

window.PDFHighlighterApplication = PDFHighlighterApplication;

// document.addEventListener(
//   "DOMContentLoaded",
//   function () {
//     PDFHighlighterApplication.open();
//   },
//   true
// );

// waiting for first animation.
const animationStarted = new Promise(function (resolve) {
    window.requestAnimationFrame(resolve);
});

// We need to delay opening until all HTML is loaded.
animationStarted.then(function () {
    main_title.textContent += "done! Now preparing to load the pdf...";
    PDFHighlighterApplication.open();
});