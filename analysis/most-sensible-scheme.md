We use is="?" for semantic clarity

And we use class-names to identify layout.

Should the content elements (p, img) get the "is", or should a container div get it?


```html
<div is="head">
    <div title class="font-[20px]">Seventh Sunday of Easter - Rite of Confirmation</div>
    <div>
        <div hnj></div>
        <div mass>Sunday 12 Noon Mass</div>
    </div>
    <div center narrow>...</div>
</div>

<div is="event">
    <div subtitle left>Prelude ...</div>
</div>

<div is="hymn.opening" vertical>
    <div title>Opening Hymn "O Jesus, Joy of Loving Hearts"</div>
    <img src="..." />
</div>

<div is="prayer.penitential" group-center>
    <div title>Penitential Rite</div>
    <pre prayer indent-alternating="2">...</pre>
</div>

<div is="response.kyrie" left-center>
    <div title>Kyrie</div>
    <img src="..." />
</div>

<div is="response.gloria" left-center>
    <div title>Gloria</div>
    <img src="..." split="?" />
</div>

<div is="reading" left-center>
    <div group-left>
        <div title>First Reading</div>
        <div subtitle>(Acts 1:12-14)</div>
    </div>
    <pre two-column>...</pre>
</div>

```


The issues with the above syntax:
1. `is` serves both semantics AND styling logic (hymns? prayers?)
2. Styling happens with attributes + tailwind classes + `is`
3. We probably want tags to be grouped in a predictable way.
    * `is` only for semantics and hierarchical differentiation (hymns vs. responses, title vs. subtitle)
    * tags only for layout arrangements + fine-tuning details for nodes
    * Tailwind for precise adjustments
4. It is very unclear what styles are container-concerning (left-center for a layout)
  and node-concerning (center to center the text)
5. It's unclear if the syntax is viable for CSS, or if the CSS will become overly rule-based.
    * Does the tag separation make the CSS rules simple? Or tangled?
    * Are Tailwind classes able to successfully override any of the other styles appearing in the whole project... ?


---

## Grouping in more detail

### `is`

As a general rule, if you ever need to insert generic text, use `<text />`.

 - `div[is=hymn]`
   - `h*`
   - `pre`
   - `img`
 - `div[is=chant]`
   - `h*`
   - `img`
   - `pre` | `p`
 - `div[is=response]`
   - `h*`
   - `pre`
   - `img`
 - `div[is=reading]`
   - `h*`
   - `label`
   - `pre`
 - `div[is=prayer]`
   - `h*`
   - `pre`
 - `div[is=marker]` | `div[is=marker.music]`
   - `h*`
   - `p`
   - `caption`

Now, with this system, we *could* make each of the `h*` have different styles
 - h1: box
 - h2: Main + underlined
 - h3: bold, not underlined
 - h4: large italic
 - h5: smaller italic
 - h6: smaller italic + underlined


### `tags`

Container layout tags (these are just flex-box shorthands):
 - `vertical` (automatically centers)
 - `vertical-left` (justifies left)
 - `horizontal`
 - `horizontal-center`
 - `horizontal-spacing`
 - `corner`

Node layout tags:
 - `left`
 - `center`
 - `right`
 - `shrink` (horizontal width)
 - `expand`
 - (indent and scale tags)

Node tuning tags:
 - font-narrow
 - font-serif
 - font-bold
 - font-italic
 - font-sans
 - font-sans-bold
 - underline

### Tailwind adjustment
 - `margin-?-[?px]`
 - `font-[?em]`
 - `padding-?-[?px]`
 - `tracking-[?em]`