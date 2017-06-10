var sqlite3 = require('sqlite3').verbose(),
    db = new sqlite3.Database('cozy');

/**
 * Please note:
 * 
 * Normally I would check for SQL injection, but time didn't permit it.
 */

// Database initialization
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='student'", function(err, row) {
   if(err !== null) console.log(err);
   else if(row == null) {
      db.run('CREATE TABLE "student" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" VARCHAR(255), "limit" INTEGER)', function(err) {
         if(err !== null) console.log(err);
         else console.log("SQL Table 'student' initialized.");
      });
      db.run('CREATE TABLE "course" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "key" VARCHAR(255), "limit" INTEGER)', function(err) {
         if(err !== null) console.log(err);
         else console.log("SQL Table 'course' initialized.");
      }); 
      db.run('CREATE TABLE "student_course" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "course_id" INTEGER, "student_id" INTEGER, "waitlist" INTEGER)', function(err) {
         if(err !== null) console.log(err);
         else console.log("SQL Table 'student_course' initialized.");
      });
   }
   else {
      console.log("Database already initialized.");
   }
});

exports.getCourse = function(key, callback) {
   db.get("SELECT * from course WHERE key='" + key + "'", callback);
};

exports.getStudent = function(name, callback) {
   db.get("SELECT * from student WHERE name='" + name + "'", callback);
};

exports.getAll = function(callback) {
    db.all("SELECT sc.waitlist, c.key, s.name from student_course sc, course c, student s " +
           "WHERE sc.course_id=c.id AND sc.student_id=s.id " +
           "ORDER BY s.name" , callback);
}

exports.createCourse = function(key, limit, callback) {
   db.run("INSERT INTO course(key, 'limit') VALUES('" + key + "', " + limit + ")", callback);
};

exports.createStudent = function(name, limit, callback) {
   db.run("INSERT INTO student(name, 'limit') VALUES('" + name + "', " + limit + ")", callback);
}

exports.getStudentCoursesCount = function(student_id, callback) {
   db.get("SELECT COUNT(*) as count from student_course WHERE student_id=" + student_id, function(err, row) {
      callback(err, row.count)
   })
};

exports.getStudentCourse = function(student_id, course_id, callback) {
   db.get("SELECT * from student_course WHERE student_id=" + student_id + " and course_id=" + course_id, callback);
};

exports.getCourseEnrollmentCount = function(course_id, callback) {
   db.get("SELECT COUNT(*) as count from student_course WHERE course_id=" + course_id + " and waitlist=0", function(err, row) {
      callback(err, row.count)
   })
};

exports.dropStudentEnrollment = function(student_id, course_id, callback) {
   db.run("DELETE FROM student_course WHERE student_id=" + student_id + " and course_id=" + course_id, callback);
}

exports.getFirstWaitlistedStudent = function(course_id, callback) {
   db.get("SELECT * from student_course WHERE course_id=" + course_id + " AND waitlist=0 ORDER BY id ASC", callback);
};

exports.enrollStudent = function(student_id, course_id, callback) {
   db.get("UPDATE student_course SET waitlist=0 WHERE student_id=" + student_id + " and course_id=" + course_id,  callback);
};

exports.addStudentToCourse = function(student_id, course_id, isWaitlisted, callback) {
   var waitlist = isWaitlisted ? 1 : 0;
   db.run("INSERT INTO student_course(student_id, course_id, waitlist) " +
          "VALUES(" + student_id + ", " + course_id + ", " + waitlist + ")",
          callback);
};