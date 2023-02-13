# arxiv-highlighter

I read a lot of papers from [arXiv](https://arxiv.org/) (:heart:), and I was missing a way to share a URL that would show a whole pdf highlighting something I consider important. This will also be useful when you are discussing a paper with someone or pointing where you found that special equation or figure. 

**UPDATE 1: Now you can browse (using those brand-new gray buttons on the top) the whole pdf instead of only one page!**     
**UPDATE 2: The back/forward controls in your browser work as undo/redo!**     
**UPDATE 3: The square brackets for rectangles were removed and each one starts with the page number where they should appear.**     


<p align="center">
<img src="https://user-images.githubusercontent.com/6606382/218593704-e5831beb-d88e-428e-abac-b6f9c17ae66a.png" width=50% height=50%>
</p>

Usage example (yup, just click on the link to see a demo, maybe try a `shift or ctrl + F5` to force reload if the rectangles look crazy):    
<a href="https://ricardodeazambuja.com/arxiv-highlighter/?url=https://arxiv.org/pdf/2103.04423.pdf&page=1&rectangle=1,g,0.79,0.53,0.87,0.55&rectangle=1,b,0.65,0.76,0.77,0.78&rectangle=1,y,0.56,0.55,0.68,0.56&rectangle=1,o,0.53,0.19,0.75,0.34&rectangle=1,r,0.30,0.32,0.49,0.33&rectangle=1,r,0.09,0.33,0.42,0.34">https://ricardodeazambuja.com/arxiv-highlighter/?url=https://arxiv.org/pdf/2103.04423.pdf&page=1&rectangle=1,g,0.79,0.53,0.87,0.55&rectangle=1,b,0.65,0.76,0.77,0.78&rectangle=1,y,0.56,0.55,0.68,0.56&rectangle=1,o,0.53,0.19,0.75,0.34&rectangle=1,r,0.30,0.32,0.49,0.33&rectangle=1,r,0.09,0.33,0.42,0.34</a>

* `?url=https://arxiv.org/pdf/2103.04423.pdf`: arxiv pdf url
* `&page=1`: starts at page 1
* `&rectangle=1,g,0.79,0.53,0.87,0.551`: page `1`, overlays a green (`g`) rectangle using coordinates `xi,yi,xf,yf` (proportional to the final page size).

## Using a mouse
To add a rectangle, simply click and drag. The rectangle will be automatically added to the address bar. Right mouse button changes the current color (the border shows it).

## Using a touch screen
To add a rectangle, simply touch and hold for 300ms (default), and drag. The rectangle will be automatically added to the address bar. Two-finger touch changes the current color (the border shows it).

## Remove or edit the annotations
All the rectangles are added to the URL in the address bar, so you can manually edit it when needed.     
## How to share or store your annotations
Share the final URL and the other person will be able to see it too, directly from the web browser, no servers involved.


## Extras
* `&alpha=0.3`: controls the alpha (transparency), defaults to 0.3.
* `&delay=300`: controls the amount of time (ms) you touch down to start a new rectangle, defaults to 300.
* `?url=test.pdf`: you can also access files from your local server.

It works with any pdf file as long as it's hosted in a place that allows Cross-Origin Resource Sharing (CORS).

## TODO
1. Test it using other browsers, operating systems, etc... because I only tested on Chrome-Linux and Safari-iOS.
2. Add a way to remove rectangles without having to edit the URL.
3. Improve the code because it's a terrible mess!
