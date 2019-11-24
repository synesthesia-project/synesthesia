var util = require('@synesthesia-project/gulp-util');
var gulp = require('gulp');

util.setupBasicTypescriptProject({
  tsconfig: 'src/tsconfig.json',
  clean: ['lib', 'index.d.ts', 'index.js'],
  outputDir: './'
});

gulp.task('default', gulp.series('clean', 'ts'));
