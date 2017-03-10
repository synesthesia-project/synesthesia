var gulp = require('gulp');
var all = require('gulp-all');
var clean = require('gulp-clean');
var gutil = require("gulp-util");
var bower = require('gulp-bower');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');
var typings = require("gulp-typings");
var sass = require('gulp-sass');
var runSequence = require('run-sequence');
var webpack = require('webpack');

var tsProject = ts.createProject('src/scripts/ts/tsconfig.json');
var extensionTsProject = ts.createProject('src/extension/ts/tsconfig.json');

gulp.task('clean', function() {
  return gulp.src(['.tmp', 'dist'], {read: false})
        .pipe(clean());
});

gulp.task('bower', function() {
  return bower();
});

gulp.task("typings", function(){
  return gulp.src("./typings.json").pipe(typings());
});

gulp.task("copy-js", function(){
  return gulp.src("./src/scripts/js/*.js")
    .pipe(gulp.dest('.tmp/scripts'))
});

gulp.task('ts', ['typings'], function () {
    return tsProject.src()
      .pipe(sourcemaps.init())
      .pipe(tsProject())
      .pipe(sourcemaps.write({
        sourceRoot: '/src/scripts/ts'
      }))
      .pipe(gulp.dest('.tmp/scripts'));
});

gulp.task('extension-ts', function () {
    return extensionTsProject.src()
      .pipe(sourcemaps.init())
      .pipe(extensionTsProject())
      .pipe(sourcemaps.write({
        sourceRoot: '/src/extension/ts'
      }))
      .pipe(gulp.dest('dist/extension'));
});

gulp.task("webpack", ['bower', 'ts', 'copy-js'], function(callback) {
    // run webpack
    webpack(module.exports = {
        entry: "./.tmp/scripts/main.js",
        output: {
            filename: "bundle.js",
            path: __dirname + "/dist"
        },

        // Enable sourcemaps for debugging webpack's output.
        devtool: "source-map",

        module: {
            preLoaders: [
                { test: /\.js$/, loader: "source-map-loader" }
            ]
        },

        // When importing a module whose path matches one of the following, just
        // assume a corresponding global variable exists and use that instead.
        // This is important because it allows us to avoid bundling all of our
        // dependencies, which allows browsers to cache those libraries between builds.
        externals: {
            "react": "React",
            "react-dom": "ReactDOM"
        },
    }, function(err, stats) {
        if(err) throw new gutil.PluginError("webpack", err);
        // gutil.log("[webpack]", stats.toString({
        //     // output options
        // }));
        callback();
    });
});

gulp.task('sass', function () {
  return gulp.src('./src/styles/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write({
      sourceRoot: '/src/styles'
    }))
    .pipe(gulp.dest('dist/styles'));
});

gulp.task("dist", ['webpack', 'sass', 'extension-ts'], function(){
  var copyCoreFiles = gulp.src([
      './src/manifest.json',
      './src/index.html'
    ])
    .pipe(gulp.dest('dist'));

  var copyLibs = gulp.src([
      './bower_components/jquery/dist/jquery.min.js',
      './bower_components/react/react.js',
      './bower_components/react/react-dom.js'])
    .pipe(gulp.dest('dist/lib'));

  return all(copyCoreFiles, copyLibs);
});


gulp.task('default', function(callback) {
  runSequence(
    'clean',
    'dist',
    callback);
});
