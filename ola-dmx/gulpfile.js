var gulp = require('gulp');
var clean = require('gulp-clean');
var ts = require('gulp-typescript');
var tslint = require('gulp-tslint');
var runSequence = require('run-sequence');

var tsProject = ts.createProject('src/tsconfig.json');

// Utility Functions

function handleError(err) {
  gutil.log("Build failed", err.message);
  process.exit(1);
}

gulp.task('clean', function() {
  return gulp.src(['build'], {read: false})
        .pipe(clean());
});

gulp.task('ts', function () {
    return tsProject.src()
      .pipe(tsProject())
      .on('error', handleError)
      .pipe(gulp.dest('build/'));
});

gulp.task('tslint', function() {
  return gulp.src(['src/**/*.ts'])
  .pipe(tslint({
    formatter: 'verbose',
    configuration: '../tslint.json'
  }))
  .on('error', handleError)
  .pipe(tslint.report());
});

gulp.task('copy-python', function () {
    return gulp.src(['src/proxy.py']).pipe(gulp.dest('build/'));
});

gulp.task('default', function(callback) {
  runSequence(
    'clean',
    ['ts', 'copy-python'],
    'tslint',
    callback);
});
