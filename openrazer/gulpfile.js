var util = require('@synesthesia-project/gulp-util');
var gulp = require('gulp');

util.setupBasicTypescriptProject({
  clean: ['index.js', 'index.d.ts', 'lib'],
  outputDir: './'
});

gulp.task('default', gulp.series('clean', 'ts'));
