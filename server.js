
require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const app = express();
const { pool } = require("./dbConfig");
const initializePassport = require("./passportConfig");
const PORT = process.env.PORT || 3005;

let latLong = [0.0,0.0];
let marineJSON;
let weatherJSON;


initializePassport(passport);

app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(express.static(__dirname));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/users/register", checkAuthenticated, (req, res) => {
  res.render("register.ejs");
});

app.get("/users/login", checkAuthenticated, (req, res) => {
  res.render("login.ejs");
});

app.get("/users/dashboard", checkNotAuthenticated, async (req, res) => {
  try {
    latLong = await getLatLong(req.session.passport.user)
    const marineURL = 'https://marine-api.open-meteo.com/v1/marine?latitude=' + latLong[0] + '&longitude=' + latLong[1] + '&hourly=wave_height,wave_direction,wave_period&timezone=America%2FNew_York&length_unit=imperial';
    const weatherURL = 'https://api.open-meteo.com/v1/forecast?latitude=' + latLong[0] + '&longitude=' + latLong[1] + '&hourly=temperature_2m,precipitation,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=kn&timezone=America%2FNew_York&forecast_days=14'
    console.log(marineURL, weatherURL);      
    const marineData = await fetch(marineURL);
    const weatherData = await fetch(weatherURL);
    const marineJSON = await marineData.json();
    const weatherJSON = await weatherData.json();
    res.render("dashboard", { user: req.user.name, weatherJSON, marineJSON })

  } catch (error) {
      console.log('Error!!')
  }
});

app.post("/users/apiCall", checkNotAuthenticated, async (req, res) => {

  try {
    latLong = await getLatLong(req.session.passport.user)
    const marineURL = 'https://marine-api.open-meteo.com/v1/marine?latitude=' + latLong[0] + '&longitude=' + latLong[1] + '&hourly=wave_height,wave_direction,wave_period&timezone=America%2FNew_York&length_unit=imperial';
    const weatherURL = 'https://api.open-meteo.com/v1/forecast?latitude=' + latLong[0] + '&longitude=' + latLong[1] + '&hourly=temperature_2m,precipitation,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=kn&timezone=America%2FNew_York&forecast_days=14'
    console.log(marineURL, weatherURL);      
    const marineData = await fetch(marineURL);
    const weatherData = await fetch(weatherURL);
    const marineJSON = await marineData.json();
    const weatherJSON = await weatherData.json();
    console.log(marineJSON)
    res.render("dashboard", { user: req.user.name, weatherJSON, marineJSON })

  } catch (error) {
      console.log('Error!!')
  }
});

app.get("/users/logout", (req,res) => {
  req.logOut(function(err) {
      if (err) { return next(err); }
      req.flash("success_msg", "You have successfully logged out.");
      res.redirect("/users/login");
  });
});


app.post("/users/register", async (req, res) => {
  let { name, email, password, password2 } = req.body;

  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ message: "Please enter all fields" });
  }

  if (password.length < 6) {
    errors.push({ message: "Password must be a least 6 characters long" });
  }

  if (password !== password2) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    res.render("register", { errors, name, email, password, password2 });
  } else {
    hashedPassword = await bcrypt.hash(password, 10);
    let q = 'SELECT * FROM users WHERE email = $1';
    console.log(q);
    let userEmail = [`{${email}}`]
   
    pool.query(
      q, userEmail,
      (err, results) => {
        if (err) {
          console.log(err);
        }
        else{}

        if (results.rows.length > 0) {
          return res.render("register", {
            message: "Email already registered"
          });
        } else {
          let p = 'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, password'
          let userName = [name]
          let userPW = [hashedPassword]
          let finEmail = [email];
          pool.query(p, [userName, finEmail, userPW],
            (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);
              req.flash("success_msg", "You are now registered. Please log in");
              res.redirect("/users/login");
            }
          );
        }
      }
    );
  }
});

app.post(
  "/users/login",
  passport.authenticate("local", {
    successRedirect: "/users/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true
  })
);

app.post("/users/addLocation", (req, res) =>{
  //req.body is the data sent by the form, latitude and longitude are the *name* attribute in the form.
  console.log(req.body.latitude + " " + req.body.longitude);
  var userID = [req.session.passport.user];
  var spot = '';
  let q = 'SELECT * FROM users WHERE id = $1 AND $2 IS NOT NULL'
  for (let i =1; i<6; i++){
    try {
      spot = 'spot' + i + 'name'
      console.log(spot)
      pool.query(
        q, [userID, spot],
        (err, results) => {
          if (err) {
            console.log(err);
          }
          else{}
  
          if (results.rows.length > 0) {
            console.log('checknext')
          } else {
            var latcol = ['spot' + i + 'lat']
            var longcol = ['spot' + i + 'long']
            var spotname = [req.body.spotname]
            var latdata = [req.body.latitude]
            var longdata = [req.body.longitude]
            let p = 'INSERT INTO users ($1, $2, $3) VALUES ($4, $5, $6)'
            pool.query(p, [spot, latcol, longcol, spotname, latdata, longdata],
              (err, results) => {
                if (err) {
                  throw err;
                }
                console.log(results.rows);
                req.flash("success_msg", "Your new spot has been saved!");
              }
            );
          }
        }
      );
    }
    catch {
  
    }
  }

})

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/users/dashboard");
  }
  next();
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/login");
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// async function getLatLong(spot, id) {
// async function getLatLong(id) {
  // var spotNameLat = 'spot' + spot + 'lat'
  // var spotNameLong = 'spot' + spot + 'long'
  // var queryString1 = 'SELECT ' + spotNameLat + ' FROM users WHERE id = ' +id;
  // var queryString2 = 'SELECT ' + spotNameLong + ' FROM users WHERE id = ' +id;

//   var queryString1 = 'SELECT spot1lat FROM users WHERE id = ' +id;
//   var queryString2 = 'SELECT spot1long FROM users WHERE id = ' +id;
//   pool.query(queryString1, 
//     (err, results) => {
//       if (err) {
//         throw err;
//       }
//       console.log(results.rows[0].spot1lat);
//       latLong[0] = results.rows[0].spot1lat;
//      }
//     );
//   pool.query(queryString2, 
//     (err, results) => {
//       if (err) {
//         throw err;
//       }
//       console.log(results.rows[0].spot1long);
//       latLong[1] = results.rows[0].spot1long;
//       }
//     );
// return latLong;
// }

async function getLatLong(id) {
  var queryString1 = 'SELECT spot1lat, spot1long FROM users WHERE id = ' +id;
    pool.query(queryString1, 
    (err, results) => {
      if (err) {
        throw err;
      }
      console.log(results.rows[0].spot1lat, results.rows[0].spot1long);
      latLong[0] = results.rows[0].spot1lat;
      latLong[1] = results.rows[0].spot1long;
     }
    );
return latLong;
}

app.get("/preferences", (req, res)=> {
  res.render("preferences")
})
