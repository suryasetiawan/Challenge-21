var express = require("express");
var bodyParser = require("body-parser");
var path = require("path");
var moment = require('moment');
var app = express();

var pg = require('pg');
var conString = 'postgres://postgres:12345@localhost:5432/bread';
var pool = new pg.Client(conString);
pool.connect();

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Body Parser Middleware
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);

// Set Static Path
app.use(express.static(path.join(__dirname, "public")));

// app.get('/', (req, res) => {
//   pool.query(`SELECT * FROM bread`, (err, data) => {
//     if (err) throw err;
    
//     res.render("index", { data: data.rows, moment });
    
//   });
// });

app.get('/', (req, res) => {
  let params = [];
  let filter = false;
  let page = req.query.page || 1;
  let limitpage = 5;
  let offset = (page - 1) * limitpage;
  let url = req.url == '/' ? '/ ? page=1' : req.url

  if (req.query.checkid && req.query.id) {
    params.push(`id = ${req.query.id}`);
    filter = true;
  }
  if (req.query.checkstring && req.query.string) {
    params.push(`string like '%${req.query.string}%'`);
    filter = true;
  }
  if (req.query.checkinteger && req.query.integer) {
    params.push(`integer = ${req.query.integer}`);
    filter = true;
  }
  if (req.query.checkfloat && req.query.float) {
    params.push(`float = '${req.query.float}'`);
    filter = true;
  }
  if (req.query.checkdate && req.query.startdate && req.query.enddate) {
    params.push(`date between '${req.query.startdate}' and '${req.query.enddate}'`);
    filter = true;
  }
  if (req.query.checkboolean && req.query.boolean) {
    params.push(`boolean = '${req.query.boolean}'`);
    filter = true;
  }
  let sql = `select count(*) as total from bread`;
  if (filter) {
    sql += ` where ${params.join(' and ')}`
    // console.log(sql);
  }

  pool.query(sql, (err, count) => {
    const page = req.query.page || 1;
    const total = count.rows[0].total;
    const pages = Math.ceil(total / limitpage);
    
    sql = `select * from bread`;
    if (filter) {
      sql += ` where ${params.join(' and ')}`
    }
    sql += ` ORDER BY ID ASC limit ${limitpage} offset ${offset}`;

    pool.query(sql, (err, rows) => {
      res.render('index', {
        bread: rows ['rows'],
        query: req.query,
        page,
        moment,
        pages,
        url
      });
    });
  });
})


app.get('/add', (req, res) => {
  res.render('add');
})

app.get('/edit/:id', function (req, res, next) {
  let id = req.params.id;
  pool.query(`SELECT * FROM bread WHERE id=${id}`, (err, data) => {
    res.render('edit', {
      item: data.rows[0],
      id: id,
      moment
    })
  })
});

// Menerima data input from user
app.post('/add', function (req, res) {

  // inserting data
  let sql = `INSERT INTO bread(string, integer, float, date, boolean) VALUES ('${req.body.string}', ${req.body.integer}, ${req.body.float},'${req.body.date}', ${req.body.boolean})`;

  pool.query(sql, function (err) {
    if (err) {
      console.log(err.message);
    }
    console.log(`data berhasil di masukkan`);
    console.log(sql);
    res.redirect('/');
    
  });
})

app.post('/edit/:id', (req, res, next) => {
  let id = req.params.id;
  let string = req.body.string;
  let integer = req.body.integer;
  let float = req.body.float;
  let date = req.body.date;
  let boolean = req.body.boolean;
  pool.query(`UPDATE bread set string='${string}', integer=${integer}, float=${float}, date='${date}', boolean='${boolean}' where id=${id} ORDER BY id ASC`, (err) => {
    if (err) {
      console.error(err);
      return res.send(err)
    }
    console.log('upgrade success');
    res.redirect('/');
  })
})

app.get('/delete/:id', function (req, res, next) {
  let id = req.params.id;
  pool.query(`DELETE FROM bread where id = ${id}`, req.body.id, (err) => {
    if (err) {
      console.log(err.message);
    }
    console.log(`data berhasil di delete`);

  });
  res.redirect('/');
});


app.listen(3000, function () {
  console.log("Server started on Port 3000...");
});
