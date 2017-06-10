var http = require('http'),
    express = require('express'),
    app = express(),
    sqlite3 = require('sqlite3').verbose(),
    bodyParser = require('body-parser'),
    database = require('./database');

/* We add configure directive to tell express to use Jade to
   render templates */
app.set('views', __dirname + '/public');
app.engine('.html', require('jade').__express);

// Allows express to get data from POST requests
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

/**
 * Please note:
 * 
 * Ideally I would have used the new async syntax to reduce the huge amount of nested functions,
 * but due to the time constraint, I couldn't set up the Babel transpiler. 
 */

app.get('/', function(req, res) {
   var result = ''
   database.getAll(function(err, all) {
      if (err != null) {
         res.status(500).send("An error has occurred -- " + err);
      } else {
         var prevName = "";
         var text = "";
         all.forEach(function(item) {
            if (item.name != prevName) {
               text += item.name + ":\n";
               prevName = item.name;
            }
            var enrollment = item.waitlist == 0 ? 'Enrolled' : 'Waitlisted';
            text += "    " + item.key + ": " + enrollment + "\n";
         })
         res.status(200).send(text);
      }
   })
});

app.post('/courses', function(req, res) {
   var key = req.query.key;
   var limit = req.query.limit;

   if (!key || !limit) {
      res.status(400).send("Invalid parameters");
   } else {
      database.getCourse(key, function(err, course) {
         if (err != null) {
            res.status(500).send("An error has occurred -- " + err);
         } else if (course) {
            res.status(400).send('Course has already been created');
         } else {
            database.createCourse(key, limit, function(err) {
               if (err != null) {
                  res.status(500).send("An error has occurred -- " + err);
               } else {
                  res.status(200).send("Successfully created");
               }
            })
         }
      })
    }
});

app.post('/students', function(req, res) {
   var name = req.query.id;
   var limit = req.query.limit;

   if (!name || !limit) {
      res.status(400).send("Invalid parameters");
   } else {
      database.getStudent(name, function(err, student) {
         if (err != null) {
            res.status(500).send("An error has occurred -- " + err);
         } else if (student) {
            res.status(400).send('Student has already been created');
         } else {
            database.createStudent(name, limit, function(err) {
               if (err != null) {
                  res.status(500).send("An error has occurred -- " + err);
               } else {
                  res.status(200).send("Successfully created");
               }
            })
         }
      })
    }
});

app.post('/students/:student_id/enroll', function(req, res) {
   var student_name = req.params.student_id;
   var course_key = req.query.course_key;

   if (!student_name || !course_key) {
      res.status(400).send("Invalid parameters");
   } else {
      database.getStudent(student_name, function(err, student) {
         if (err != null) {
            res.status(500).send("An error has occurred -- " + err);
         } else if (!student) {
            res.status(400).send('Student not found');
         } else {
            database.getStudentCoursesCount(student.id, function(err, count) {
               if (count >= student.limit) {
                  res.status(400).send('Student may not enroll in any more classes')
               } else {
                  database.getCourse(course_key, function(err, course) {
                     if (err != null) {
                        res.status(500).send("An error has occurred -- " + err);
                     } else if (!course) {
                        res.status(400).send('Course not found');
                     } else {
                        database.getCourseEnrollmentCount(course.id, function(err, count) {
                           if (err != null) {
                              res.status(500).send("An error has occurred -- " + err);
                           } else {
                              var isWaitlisted = count >= course.limit;
                              database.addStudentToCourse(student.id, course.id, isWaitlisted, function(err) {
                                 if (err != null) {
                                    res.status(500).send("An error has occurred -- " + err);
                                 } else {
                                    res.status(200).send("Successfully enrolled student");
                                 }
                              })
                           }
                        })
                     }
                  })
               }
            })
         }
      })
    }
});

app.post('/students/:student_id/drop', function(req, res) {
   var student_name = req.params.student_id;
   var course_key = req.query.course_key;

   if (!student_name || !course_key) {
      res.status(400).send("Invalid parameters");
   } else {
      database.getStudent(student_name, function(err, student) {
         if (err != null) {
            res.status(500).send("An error has occurred -- " + err);
         } else if (!student) {
            res.status(400).send('Student not found');
         } else {
            database.getCourse(course_key, function(err, course) {
               if (err != null) {
                  res.status(500).send("An error has occurred -- " + err);
               } else if (!course) {
                  res.status(400).send('Course not found');
               } else {
                  database.getStudentCourse(student.id, course.id, function(err, studentCourse) {
                     if (err != null) {
                        res.status(500).send("An error has occurred -- " + err);
                     } else if (!studentCourse) {
                        res.status(400).send('Student course not found');
                     } else {
                        database.dropStudentEnrollment(student.id, course.id, function(err) {
                           if (err != null) {
                              res.status(500).send("An error has occurred -- " + err);
                           } else {
                              database.getFirstWaitlistedStudent(course.id, function(err, firstStudent) {
                                 if (err != null) {
                                    res.status(500).send("An error has occurred -- " + err);
                                 } else if (!firstStudent) {
                                     res.status(200).send("Successfully dropped student");
                                 } else {
                                    database.enrollStudent(firstStudent.id, course.id, function(err) {
                                       if (err != null) {
                                          res.status(500).send("An error has occurred -- " + err);
                                       } else {
                                          res.status(200).send("Successfully dropped student");
                                       }
                                    })
                                 }
                              })
                           }
                        })
                     }
                  })
               }
            })
         }
      })
    }
});

// We define another route that will handle bookmark deletion
app.get('/delete/:id', function(req, res) {
    db.run("DELETE FROM bookmarks WHERE id='" + req.params.id + "'", function(err) {
        if(err !== null) {
            res.status(500).send("An error has occurred -- " + err);
        }
        else {
            res.redirect('back');
        }
    });
});

/* This will allow the app to run smoothly but
 it won't break other execution environment */
var port = process.env.PORT || 9250;
var host = process.env.HOST || "127.0.0.1";

// Starts the server itself
var server = http.createServer(app).listen(port, host, function() {
    console.log("Server listening to %s:%d within %s environment",
                host, port, app.get('env'));
});