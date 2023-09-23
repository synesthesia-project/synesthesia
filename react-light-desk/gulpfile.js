var util = require('@synesthesia-project/gulp-util');
var gulp = require('gulp');

util.setupBasicTypescriptProject({
  clean: ['lib'],
  outputDir: './lib'
});

gulp.task('default', gulp.series('clean', 'ts'));
