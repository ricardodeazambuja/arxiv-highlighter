# arxiv-highlighter

I read a lot of papers from [arXiv](https://arxiv.org/) (:heart:), and I was missing a way to share a URL that would show a page highlighting something I consider important. This page will also be useful when you are discussing a paper with someone or pointing where you found that special equation or figure. 

Usage example (yup, just click on the link to see a demo):    
https://ricardodeazambuja.com/arxiv-highlighter/?url=https://arxiv.org/pdf/1606.08415.pdf&page=2&rectangle=[g,0.29,0.48,0.70,0.51]&rectangle=[b,0.45,0.17,0.83,0.40]&rectangle=[y,0.45,0.57,0.55,0.60]&rectangle=[o,0.36,0.17,0.43,0.19]&rectangle=[o,0.17,0.19,0.41,0.20]

* `?url=https://arxiv.org/pdf/1606.08415.pdf`: arxiv pdf url
* `&page=2`: opens the page number 2
* `&rectangle=[g,0.29,0.48,0.70,0.51]`: overlays a green (`g`) rectangle using coordinates `[xi,yi,xf,yf]` (proportional to the final page size).

To add a rectangle, simply click and drag. The rectangle will be automatically added to the address bar. Right mouse button changes the current color (the border shows it).

Share the final URL and the other person will be able to see it too, directly from the web browser, no servers involved.
