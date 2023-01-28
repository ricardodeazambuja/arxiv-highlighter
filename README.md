# arxiv-higjlighter

I read a lot of papers from [arXiv](https://arxiv.org/) (:heart:), and I was missing a way to share a URL that would show a page highlighting something I consider important. This page will also be useful when you are discussing a paper with someone or pointing where you found that special equation or figure. 

Usage example:
`https://ricardodeazambuja.com/arxiv-highlighter/?url=https://arxiv.org/pdf/1606.08415.pdf&page=2&rectangle=[r,161,488,331,533]&rectangle=[g,392,488,546,541]`

* ?url=https://arxiv.org/pdf/1606.08415.pdf: arxiv pdf url
* &page=2: opens the page number 2
* &rectangle=[r,161,488,331,533]: overlays a red (`r`) rectangle using coordinates `[xi,yi,xf,yf]`
* &rectangle=[g,392,488,546,541]: overlays a blue (`b`) rectangle using coordinates `[xi,yi,xf,yf]`

To add a rectangle, simply click and drag. The rectangle will be automatically added to the address bar. Right mouse button changes the current color (the border shows it).

Share the final URL and the other person will be able to see it too, directly from the web browser, no servers involved.
