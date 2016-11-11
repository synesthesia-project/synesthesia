var gulp = require('gulp');
var bower = require('gulp-bower');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');
var typings = require("gulp-typings");

var tsProject = ts.createProject('scripts/ts/tsconfig.json');

gulp.task('bower', function() {
  return bower();
});

gulp.task("typings", function(){
    return gulp.src("./typings.json").pipe(typings());
});

gulp.task('ts', ['typings'], function () {
    return tsProject.src()
      .pipe(sourcemaps.init())
      .pipe(ts(tsProject))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('scripts'));
});

gulp.task('default', ['bower', 'ts']);
