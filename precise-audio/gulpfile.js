var util = require('@synesthesia-project/gulp-util');
var gulp = require('gulp');

util.setupBasicTypescriptProject({
  clean: ['index.js', 'index.js.map', 'index.d.ts', 'index.d.ts.map'],
  outputDir: './',
  sourcemap: 'external'
});

gulp.task('default', gulp.series('clean', 'ts'));
