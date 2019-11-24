var log = require('fancy-log');
var gulp = require('gulp');
var clean = require('gulp-clean');
var ts = require('gulp-typescript');
var tslint = require('tslint');
var gulpTslint = require('gulp-tslint');
var merge = require('merge2'); 

var tsProject = ts.createProject('src/tsconfig.json');

// Utility Functions

function handleError(err) {
  log("Build failed", err.message);
  process.exit(1);
}

gulp.task('clean', function() {
  return gulp.src(['lib'], {read: false})
        .pipe(clean());
});

gulp.task('ts', function () {
  const tsResult = tsProject.src()
      .pipe(tsProject())
      .on('error', handleError);

  return merge([
    tsResult.dts.pipe(gulp.dest('lib')),
    tsResult.js.pipe(gulp.dest('lib'))
  ]);
});

gulp.task('tslint', function () {
  var program = tslint.Linter.createProgram("src/tsconfig.json");

  return gulp.src(['src/**/*.ts'])
    .pipe(gulpTslint({
      formatter: 'verbose',
      configuration: '../tslint.json',
      program
    }))
    .on('error', handleError)
    .pipe(gulpTslint.report());
});

gulp.task('default', gulp.series('clean', 'ts'));
