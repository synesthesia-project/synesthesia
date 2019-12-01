var util = require('@synesthesia-project/gulp-util');
var gulp = require('gulp');
var mocha = require('gulp-mocha');

util.setupBasicTypescriptProject({
  clean: ['build'],
  outputDir: 'build/',
  sourcemap: true,
  sourcemapSourceRoot: '../../../src'
});

gulp.task('default', gulp.series('clean', 'ts'));

gulp.task('test', () =>
	gulp.src('build/test/**/*.js', {read: false})
		.pipe(mocha({reporter: 'nyan'}))
);