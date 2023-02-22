# arxiv-highlighter

I read a lot of papers from [arXiv](https://arxiv.org/) (:heart:), and I was missing a way to share a URL that would show a whole pdf highlighting, with or without notes, something I consider important. This will also be useful when you are discussing a paper with someone or pointing where you found that special equation or figure. 


<p align="center">
<img src="https://user-images.githubusercontent.com/6606382/218593704-e5831beb-d88e-428e-abac-b6f9c17ae66a.png" width=50% height=50%>
</p>

Usage example (yup, just click on the link to see a demo, maybe try a `shift or ctrl + F5` to force reload if the rectangles look crazy):    
<a href="https://arxiv-highlighter.github.io/#url=https://arxiv.org/abs/2103.04423&page=1&cdata=IwGg5iAMB0wBxWgZgCyIExpkgbCAQgKYA2A9gO4AE5AFgIYAulAzqQLaGUDGpArgHYMATgEtCzbqX7MRAE0JDKDGpzZ0AHiLa821QiLA0mAI0IAzUkM7LO-QoVmULi5gAdCXEXWKViIroTS4iCUhAxc0ABkoKSIAKzoiMAAnIgA7HGISJkAirx0sjyuDAqUvDL8YJR0lGwi6gy8VpSkZpSiYHLV-I5mxISaxv2UrnRCDMxRiUJJWNDomTDoaRgrACoqlMZ0bMakpJQAbgoyUpQiEoR0MqUMB8a8IsSyIQ9MIu8S-cwSQqQPzCYdDAdBE0iYXCE1xUk0iiQAnhg8EsVjAUKklghIkhwIhIKjoJBFtBkqAljiNuJOFpgeJqs0bO0rqx+EoaBcRrSlHQANZ0siVW4HKw9BQAQiAA">https://arxiv-highlighter.github.io/#url=https://arxiv.org/abs/2103.04423&page=1&cdata=IwGg5iAMB0wBxWgZgCyIExpkgbCAQgKYA2A9gO4AE5AFgIYAulAzqQLaGUDGpArgHYMATgEtCzbqX7MRAE0JDKDGpzZ0AHiLa821QiLA0mAI0IAzUkM7LO-QoVmULi5gAdCXEXWKViIroTS4iCUhAxc0ABkoKSIAKzoiMAAnIgA7HGISJkAirx0sjyuDAqUvDL8YJR0lGwi6gy8VpSkZpSiYHLV-I5mxISaxv2UrnRCDMxRiUJJWNDomTDoaRgrACoqlMZ0bMakpJQAbgoyUpQiEoR0MqUMB8a8IsSyIQ9MIu8S-cwSQqQPzCYdDAdBE0iYXCE1xUk0iiQAnhg8EsVjAUKklghIkhwIhIKjoJBFtBkqAljiNuJOFpgeJqs0bO0rqx+EoaBcRrSlHQANZ0siVW4HKw9BQAQiAA</a>

* `#url=https://arxiv.org/abs/2103.04423`: arxiv url
* `&page=1`: starts at page 1
* `&cdata=...`: compressed data in URI friendly format

## Using a mouse
To add an annotation (rectangle), simply click and drag. A prompt box will allow you to add a note, otherwise just close it. The annotation will be automatically added to the address bar. Click on a rectangle to see (or edit) the note. Right-click on a rectangle to delete it. Right-click everywhere else to change the current color (the border shows it).

## Using a touch screen
To add an annotation (rectangle), simply touch and hold for 300ms (default), and drag. The rectangle will be automatically added to the address bar. One-finger touch on a rectangle will allow you to see (or edit) the note. Two-finger touch on rectangle will delete it. Two-finger touch everywhere else to change the current color (the border shows it).

## Change the pdf page
Just click on the gray boxes on the left (`<`) / right (`>`) rendered over the pdf. You can also change the value (`page`) in the URL and reload.

## How to share or store your annotations
Share the final URL and the other person will be able to see it too, directly from the web browser (thanks to the *magical* `#`), no servers involved.


## Extras
* `&alpha=0.3`: controls the alpha (transparency), defaults to 0.3.
* `&delay=300`: controls the amount of time (ms) you touch down to start a new rectangle, defaults to 300.
* `&search=false`: enable/disable searchable text (mobile browsers seem to struggle with the big svg generated).
* `#url=test.pdf`: you can also access files from your local server.
* `&cdata=...&cdata=...&cdata=...`: annotations created individually can be fused together by pasting multiple `cdata` fields on the same URL.

It works with any pdf file as long as it's hosted in a place that allows Cross-Origin Resource Sharing (CORS).

## TODO
1. Test it using other browsers, operating systems, etc... because I only tested on Chrome-Linux and Safari-iOS.
2. Solve the problems with the touch interface when zooming in/out.
3. Improve the code because it's a terrible mess!
