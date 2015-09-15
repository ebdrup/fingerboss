var gulp = require('gulp');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var addSrc = require('gulp-add-src');

gulp.task('compress', function () {
	return gulp.src(['js/**/*.js'])
		.pipe(sourcemaps.init())
		.pipe(uglify())
		.pipe(addSrc('js-min/*.js'))
		.pipe(concat('bundle.js'))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('public'));
});

gulp.task('watch', function () {
	gulp.watch('js/**/*.js', ['compress']);
});

gulp.task('webserver', function () {
	require('./server');
});

gulp.task('default', function () {
	gulp.run(['compress', 'watch', 'webserver']);
});