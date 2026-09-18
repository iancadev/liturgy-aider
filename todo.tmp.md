Seems close to completion, honestly.

It only took making the images smaller (much smaller) and sizing them correctly.

1. Make sure the fonts are professional (we're a little picky about comparing to original fonts)
2. Figure out why the font-estimation script broke for Pater Noster (there's nothing apparently wrong there)
3. Try to make the text-placements less janky
    - perhaps we can use flex-grow fractions?
4. Prepare some demo arrangements for the workflow, and ask for feedback
5. Fix the Replacement and Browser features






TO-DO (2026 September 16)

1. Fix the split-image logic for gloria
2. Fix 5-line staff detection logic (actually detect all-black lines?)
3. Fix image hashing so it includes image contents
4. Improve auto-layout logic and variables
5. Enable more fields for Preview
6. New 3-form penitential rite layout

(big): larger liturgy-aid navigation ability



TO-DO (2026 September 17)

1. We want to abstract the file-system logic a bit?
A) HTML edit was compiled multiple times, apply to other file watchers? 
B) when the src was "" (a directory, not an image file), it really threw a spanner in the works
C) HTML_DIR and the HTTP/data/local image handling leaves much to be desired.
2. Make it so if you click in the browser -> it opens for you to edit a temp file (in Notepad)?
3. We want to fix the layouts a bit. Why are text sizes sometimes very inconsistent? Why are there sometimes big gaps and small text? (or at least the appearance of big gaps) Preface dialogue vs Pater Noster. Gloria big, readings small?
4. Reading labels should be left-justified, div as a whole should be centered.
5. Why can't you have multiple localhost tabs open at once? (One to preview, one to replacement?)
6. Why isn't relayout consistently running? (sometimes needing to reload)
7. Fix the selectors on /replacement to be slightly more useful?
8. Let's really make a separate webpage for debugging the split image logic.
9. Move-to resources directory + delete unused files command would be great
10. It's a little annoying that the script got moved to <head>. Maybe we can just make a pre element that's handled during compilation.