# Welcome

### How it works

Open a terminal, `cd server`, and `npm run dev`.

Set the HTML file you are editing at [localhost:5173/](localhost:5173/).

You can:

1. Edit the HTML file in your favorite editor, preview the changes at [localhost:5173/preview](localhost:5173/preview).

2. Open [localhost:5173/replacement](localhost:5173/replacement) to do in-place substitutions of texts and image files.

3. Use any of the modifier attributes for in-line HTML changes, or put your `.ltrg.css` stylesheets in `styles/`, to make the document look how you want it to.

You can also mess with the layout logic for `/preview` by editing the values here: `server\src\lib\layout.ts`.

### Syntax Rules

Every element must have an "is" attribute to appear in the `/replacement` view.

These "is" attributes must be unique, or `/replacement` will do funny things.

To insert a page-break, put an `<hr>` element.

### Modifiers

These include

 - `scale="?"`: scales the relative font-size of an element.
 - `two-column` or `two-column-divided`: splits 
 - for `pre` elements: `indent="?"` will put spaces before any lower-case line (except the first line)
 - for local images: `split="n"` will split the image by the nth horizontal white region counting from the top (0 will usually be the margin at the top).
   - NOTE: if you aren't seeing a change in the image, it may be due to browser cache; just reload the page.