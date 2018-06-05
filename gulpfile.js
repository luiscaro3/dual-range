// Gulp
var gulp = require('gulp');

//Dependencies
var babel = require('gulp-babel');

// Sass/CSS stuff
var sass = require('gulp-sass');
var prefix = require('gulp-autoprefixer');
var minifycss = require('gulp-minify-css');

// JavaScript
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var order  = require('gulp-order');
var sourcemaps = require('gulp-sourcemaps');

// Images
var svgmin = require('gulp-svgmin');
var imagemin = require('gulp-imagemin');

// Compile all your Sass
gulp.task('sass', function() {
  var task = gulp.src(['assets/sass/main.scss'])
  .pipe(sass({ outputStyle: 'expanded' }))
  .pipe(prefix("last 1 version", "> 1%"));
  
  task.pipe(gulp.dest('assets'));
});



// Scripts
gulp.task('js', function() {
  var task = gulp.src(['assets/js/**/*.js'])
  .pipe(order([
    'vendor/**/*.js',
    '**/!(main)*.js',
    'main.js'
  ], { base: './' }))
  .pipe(concat('main.js'));
  
  task.pipe(gulp.dest('assets'));
});


gulp.task('default', function() {
  gulp.start(['sass', 'js']);
  gulp.watch('assets/**/*.*', function(file){
    var fileURL = file.path.split('\\')
    assetType = fileURL[fileURL.indexOf('assets') + 1];
    
    //Only watch files inside the asset folder
    if(assetType == 'sass' || assetType == 'js') {
      gulp.start([assetType]);
    }
  });
});
