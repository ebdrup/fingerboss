var path = require('path');
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var addSrc = require('gulp-add-src');
var browserify = require('gulp-browserify');


console.log(path.join(path.dirname(require.resolve('howler')), '../dist/howler.min.js'));

gulp.task('compress', function () {
	return gulp.src(['js/**/*.js', path.join(path.dirname(require.resolve('socket.io-client')), '../socket.io.js')])
		.pipe(sourcemaps.init())
		.pipe(uglify())
		.pipe(addSrc([
			path.join(path.dirname(require.resolve('pixi.js')), '../bin/pixi.min.js'),
			path.join(path.dirname(require.resolve('howler')), '../dist/howler.min.js'),
			'js-min/*.min.js',
			'js-min/*.min.last.js'
		]))
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