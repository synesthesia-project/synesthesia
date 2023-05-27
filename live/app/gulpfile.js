var util = require('@synesthesia-project/gulp-util');
var gulp = require('gulp');

util.setupBasicTypescriptProject({
  clean: ['build'],
  outputDir: 'build'
});

gulp.task('default', gulp.series('clean', 'ts'));
