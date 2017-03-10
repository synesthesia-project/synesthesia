# Synesthesia Composer

This is the composer part of the synesthesia project. A 5 minute lightning talk
of the project can be found here: <https://www.youtube.com/watch?v=egsswPi8yio>

It is very much a work in progress!

## Building / Usage

The main way in which to use this project is as a chrome extension (but the
html files output in `dist/` can also be used directly).

To Build:

* Run `npm install && gulp` if you have `gulp` installed globally
* Or run `npm install && ./node_modules/gulp/bin/gulp.js`

This output of the build is put in `dist/`, and you can either open
`dist/index.html` directly in your browser, or install the `dist/` directory as
a chrome extension (which gives you more functionality such as connecting to
google play music).

## Special Thanks

The style of this app has been heavily inspired by the
[Vertex Theme for GTK](https://github.com/horst3180/vertex-theme)
