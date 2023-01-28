# arxiv-highlighter

I read a lot of papers from [arXiv](https://arxiv.org/) (:heart:), and I was missing a way to share a URL that would show a page highlighting something I consider important. This page will also be useful when you are discussing a paper with someone or pointing where you found that special equation or figure. 

<p align="center">
<img src="https://user-images.githubusercontent.com/6606382/215234922-c68add34-f3b4-4191-96ad-5926161be989.png" width=50% height=50%>
</p>

Usage example (yup, just click on the link to see a demo):    
https://ricardodeazambuja.com/arxiv-highlighter/?url=https://arxiv.org/pdf/2103.04423.pdf&page=1&rectangle=[g,0.79,0.53,0.87,0.55]&rectangle=[b,0.65,0.76,0.77,0.78]&rectangle=[y,0.56,0.55,0.68,0.56]&rectangle=[o,0.53,0.19,0.75,0.34]&rectangle=[r,0.30,0.32,0.49,0.33]&rectangle=[r,0.09,0.33,0.42,0.34]

* `?url=https://arxiv.org/pdf/2103.04423.pdf`: arxiv pdf url
* `&page=1`: opens at page 1
* `&rectangle=[g,0.79,0.53,0.87,0.55]`: overlays a green (`g`) rectangle using coordinates `[xi,yi,xf,yf]` (proportional to the final page size).

To add a rectangle, simply click and drag. The rectangle will be automatically added to the address bar. Right mouse button changes the current color (the border shows it).

Share the final URL and the other person will be able to see it too, directly from the web browser, no servers involved.
