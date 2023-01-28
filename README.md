# arxiv-highlighter

I read a lot of papers from [arXiv](https://arxiv.org/) (:heart:), and I was missing a way to share a URL that would show a page highlighting something I consider important. This page will also be useful when you are discussing a paper with someone or pointing where you found that special equation or figure. 

<p align="center">
<img src="https://user-images.githubusercontent.com/6606382/215234922-c68add34-f3b4-4191-96ad-5926161be989.png" width=50% height=50%>
</p>

Usage example (yup, just click on the link to see a demo, maybe try a `shift or ctrl + F5` to force reload if the rectangles look crazy):    
https://ricardodeazambuja.com/arxiv-highlighter/?url=https://arxiv.org/pdf/2103.04423.pdf&page=1&rectangle=[g,0.79,0.53,0.87,0.55]&rectangle=[b,0.65,0.76,0.77,0.78]&rectangle=[y,0.56,0.55,0.68,0.56]&rectangle=[o,0.53,0.19,0.75,0.34]&rectangle=[r,0.30,0.32,0.49,0.33]&rectangle=[r,0.09,0.33,0.42,0.34]

* `?url=https://arxiv.org/pdf/2103.04423.pdf`: arxiv pdf url
* `&page=1`: opens at page 1
* `&rectangle=[g,0.79,0.53,0.87,0.55]`: overlays a green (`g`) rectangle using coordinates `[xi,yi,xf,yf]` (proportional to the final page size).

## Using a mouse
To add a rectangle, simply click and drag. The rectangle will be automatically added to the address bar. Right mouse button changes the current color (the border shows it).

## Using a touch screen
To add a rectangle, simply touch and hold for 300ms (default), and drag. The rectangle will be automatically added to the address bar. Two-finger touch changes the current color (the border shows it).

## Remove or edit the annotations
All the rectangles are added to the URL in the address bar, so you can manually edit it when needed.     
## How to share or store your annotations
Share the final URL and the other person will be able to see it too, directly from the web browser, no servers involved.


## Extras
* `?local=filename.pdf`: will serve a local pdf file.
* `&alpha=0.3`: controls the alpha (transparency), defaults to 0.3.
* `&delay=300`: controls the amount of time (ms) you touch down to start a new rectangle, defaults to 300.

It works with any pdf file as long as it's hosted in a place that allows Cross-Origin Resource Sharing (CORS).

## TODO
Test it using other browsers, operating systems, etc... because I only tested on Chrome-Linux and Safari-iOS.
