var log = require('fancy-log');
var gulp = require('gulp');
var clean = require('gulp-clean');
var ts = require('gulp-typescript');
var gulpEslint  = require('gulp-eslint-new');

var tsProject = ts.createProject('src/tsconfig.json');

// Utility Functions

function handleError(err) {
  log("Build failed", err.message);
  process.exit(1);
}

gulp.task('clean', function() {
  return gulp.src(['build'], { read: false, allowEmpty: true })
        .pipe(clean());
});

gulp.task('ts', function () {
    return tsProject.src()
      .pipe(tsProject())
      .on('error', handleError)
      .pipe(gulp.dest('build/'));
});

gulp.task('lint', () =>
  gulp.src(['src/**/*.ts', 'src/**/*.tsx'])
    .pipe(gulpEslint())
    .pipe(gulpEslint.format())
    .pipe(gulpEslint.failAfterError())
);

gulp.task('lint:fix', () =>
  gulp.src(['src/**/*.ts', 'src/**/*.tsx'])
    .pipe(gulpEslint({ fix: true }))
    .pipe(gulpEslint.fix())
    .pipe(gulpEslint.format())
    .pipe(gulpEslint.failAfterError())
);

gulp.task('default', gulp.series('clean', 'ts'));
