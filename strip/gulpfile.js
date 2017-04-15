var gulp = require('gulp');
var clean = require('gulp-clean');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');
var runSequence = require('run-sequence');

var tsProject = ts.createProject('src/ts/tsconfig.json');
var demoTsProject = ts.createProject('src/demo/ts/tsconfig.json');

gulp.task('clean', function() {
  return gulp.src(['build'], {read: false})
        .pipe(clean());
});

gulp.task('ts', function () {
    return tsProject.src()
      .pipe(sourcemaps.init())
      .pipe(tsProject())
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('build/ts/'));
});

gulp.task('demo-ts', function () {
    return demoTsProject.src()
      .pipe(sourcemaps.init())
      .pipe(demoTsProject())
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('build/demo/'));
});

gulp.task('demo', function () {
    return gulp.src(['src/demo/*.html', 'src/demo/*.css']).pipe(gulp.dest('build/demo/'));
});

gulp.task('demo-lib', function () {
    return gulp.src(['bower_components/jquery/dist/jquery.*']).pipe(gulp.dest('build/demo/lib/'));
});

gulp.task('default', function(callback) {
  runSequence(
    'clean',
    'ts',
    ['demo-ts', 'demo', 'demo-lib'],
    callback);
});
