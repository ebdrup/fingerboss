const path = require("path");
const gulp = require("gulp");
const concat = require("gulp-concat");
const nodemon = require("gulp-nodemon");
const staticFiles = require("./staticFiles");

gulp.task("compress", function() {
  return gulp
    .src(staticFiles.concat(["js/**/*.js"]))
    .pipe(concat("bundle.js"))
    .pipe(gulp.dest("public"));
});

gulp.task("watch", function() {
  gulp.watch("js/**/*.js", ["compress"]);
});

gulp.task("webserver", function() {
  var stream = nodemon({
    script: "server.js",
    ext: "js html",
    env: { NODE_ENV: "development" },
    ignore: ["public/bundle.*"],
    tasks: function(changedFiles) {
      var tasks = [];
      console.log(changedFiles);
      changedFiles &&
        changedFiles.forEach &&
        changedFiles.forEach(function(file) {
          if (path.extname(file) === ".js" && !~tasks.indexOf("compress")) {
            tasks.push("compress");
          }
        });
      return tasks;
    }
  });
  stream
    .on("restart", function() {
      console.log("restarted!");
    })
    .on("crash", function() {
      console.error("Application has crashed!\n");
      stream.emit("restart", 1); // restart the server in 1 seconds
    });
});

gulp.task("default", function() {
  gulp.run(["compress", "watch", "webserver"]);
});
