var gulp = require('gulp');
var clean = require('gulp-clean');
var gutil = require("gulp-util");
var ts = require('gulp-typescript');
var runSequence = require('run-sequence');
var webpack = require('webpack');

var tsProject = ts.createProject('src/tsconfig.json');

// Utility Functions

function handleError(err) {
  gutil.log("Build failed", err.message);
  process.exit(1);
}

gulp.task('clean', function() {
  return gulp.src(['.tmp', 'build'], {read: false})
        .pipe(clean());
});

gulp.task("copy-html", function(){
  return gulp.src("./src/*.html")
    .pipe(gulp.dest('build/'))
});

gulp.task('ts', function () {
    return tsProject.src()
      .pipe(tsProject())
      .on('error', handleError)
      .pipe(gulp.dest('.tmp'));
});

gulp.task('lint', () =>
  gulp.src(['src/**/*.ts', 'src/**/*.tsx'])
    .pipe(gulpEslint())
    .pipe(gulpEslint.format())
    .pipe(gulpEslint.failAfterError())
);

gulp.task("webpack", ['ts'], function(callback) {
    // run webpack
    webpack({
        entry: "./.tmp/main.js",
        output: {
            filename: "main.js",
            path: __dirname + "/build"
        },
    }, function(err, stats) {
        if(err) throw new gutil.PluginError("webpack", err);
        // gutil.log("[webpack]", stats.toString({
        //     // output options
        // }));
        callback();
    });
});

gulp.task('default', function(callback) {
  runSequence(
    'clean',
    ['webpack', 'copy-html'],
    'lint',
    callback);
});
