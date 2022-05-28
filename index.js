const express = require('express');
const bodyParser = require('body-parser');
var app = express();
var mysql = require('mysql');
// const swaggerJSDoc = require('swagger-jsdoc');
// const swaggerUi = require('swagger-ui-express');

// const options ={
//   definitions: {
//     openapi: '3.0.0',
//     info : {
//       title: 'AIG Royal ERP apis',
//       version: '1.0.0'
//     },
//     servers: [
//       {
//         url: 'https://2646-103-163-108-188.in.ngrok.io'
//       }
//     ]
//   },
//   apis: ['C:\Users\Rohan Aggarwal\nodejs\restful-api\index.js']
// }

// const swaggerSpec = swaggerJSDoc(options)

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

console.log('Get connection ...');

// parse application/json
app.use(bodyParser.json());

//create database connection
var conn = mysql.createConnection({
    database: 'aig_crm',
    host: "localhost",
    user: "root",
    password: "rohan@1007",
    connectTimeout: 60000
  });

//connect to database
conn.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });

//show main
app.get('/api/main',(req, res) => {
  let sql = "select s_no, tower, booking_date, cb.unit_no, area_sqft, name, mob_no, email, broker, plan, loan, rate, nbp, gst, tbc, tdtd, rwgst, if(rwgst*0.05>ifnull(rgst, 0)>0, rgst, rwgst*0.05) as rgst, if(rwgst*0.05>ifnull(rgst, 0)>0, rwgst-rgst, rwgst-rwgst*0.05) as rwogst, rwgst*100/tbc as rec_per, tbc-rwgst as balance, tdtd-rwgst as o_t from(select s_no, booking_date, tower, unit_no, area_sqft, name, mob_no, email, broker, plan, loan, if(nbp=0, tbc/area_sqft, nbp/area_sqft) as rate, if(nbp=0, tbc-tbc*5/105, nbp) as nbp, if(nbp=0, tbc*5/105, nbp*0.05) as gst, if(tbc=0, nbp+nbp*0.05, tbc) as tbc, if(tbc=0, (nbp+nbp*0.05)*0.4, tbc*0.4) as tdtd from customer)cb left join (select unit_no, sum(rwgst) as rwgst, sum(rgst) as rgst from customer_account group by unit_no)cba on cb.unit_no=cba.unit_no";
  let query = conn.query(sql, (err, results) => {
      if(err){
        throw err
      }
      else {
        res.send(JSON.stringify(results))
      };
  });
  });

//show receipt
app.get('/api/receipt',(req, res) => {
  let sql = "SELECT concat(unit_no,'[',id,']') as id, substring(unit_no,1,1) as tower, unit_no, payment_mode, date, bank_name, rwgst, rgst, receipt_no, status FROM customer_account";
  let query = conn.query(sql, (err, results) => {
      if(err){
        throw err
      }
      else {
        res.send(JSON.stringify(results))
      };
  });
  });

//show demand
app.get('/api/demand',(req, res) => {
  let sql = "select id, substring(unit_no,1,1) as tower, unit_no, DATE_FORMAT(due_date, '%d-%m-%Y') as due_date, particulars, percentage, net_bsp, gst, net_due, recieved, net_due-recieved as pending_amount from customer_payment_plan where due_date>=now() and due_date is not null and recieved<net_due";
  let query = conn.query(sql, (err, results) => {
      if(err){
        throw err
      }
      else {
        res.send(JSON.stringify(results))
      };
  });
  });

//show reminder
app.get('/api/reminder',(req, res) => {
  let sql = "select id, substring(unit_no,1,1) as tower, unit_no, DATE_FORMAT(due_date, '%d-%m-%Y') as due_date, particulars, percentage, net_bsp, gst, net_due, recieved, net_due-recieved as pending_amount from customer_payment_plan where due_date<now() and due_date is not null and recieved<net_due";
  let query = conn.query(sql, (err, results) => {
      if(err){
        throw err
      }
      else {
        res.send(JSON.stringify(results))
      };
  });
  });

//show reportDR
app.get('/api/reportDR',(req, res) => {
  let sql = "select if(due_date<now(), count(unit_no), 0) as total_reminders, if(due_date>=now(), count(unit_no), 0) as total_demand, count(unit_no) as total from customer_payment_plan where due_date is not null and recieved<net_due";
  let query = conn.query(sql, (err, results) => {
      if(err){
        throw err
      }
      else {
        res.send(JSON.stringify(results))
      };
  });
  });

//show reportR
app.get('/api/reportR',(req, res) => {
  let sql = "select if(status=0, count(unit_no), 0) as pending, if(status=1, count(unit_no), 0) as approved, count(unit_no) as total from customer_account";
  let query = conn.query(sql, (err, results) => {
      if(err){
        throw err
      }
      else {
        res.send(JSON.stringify(results))
      };
  });
  });

//show main for tower
app.get('/api/main/:tower',(req, res) => {
let sql = "select s_no, tower, booking_date, cb.unit_no, area_sqft, name, mob_no, email, broker, plan, loan, rate, nbp, gst, tbc, tdtd, rwgst, if(rwgst*0.05>ifnull(rgst, 0)>0, rgst, rwgst*0.05) as rgst, if(rwgst*0.05>ifnull(rgst, 0)>0, rwgst-rgst, rwgst-rwgst*0.05) as rwogst, rwgst*100/tbc as rec_per, tbc-rwgst as balance, tdtd-rwgst as o_t from(select s_no, booking_date, tower, unit_no, area_sqft, name, mob_no, email, broker, plan, loan, if(nbp=0, tbc/area_sqft, nbp/area_sqft) as rate, if(nbp=0, tbc-tbc*5/105, nbp) as nbp, if(nbp=0, tbc*5/105, nbp*0.05) as gst, if(tbc=0, nbp+nbp*0.05, tbc) as tbc, if(tbc=0, (nbp+nbp*0.05)*0.4, tbc*0.4) as tdtd from customer)cb left join (select unit_no, sum(rwgst) as rwgst, sum(rgst) as rgst from customer_account group by unit_no)cba on cb.unit_no=cba.unit_no where tower="+req.params.tower;
let query = conn.query(sql, (err, results) => {
    if(err){
      throw err
    }
    else {
      res.send(JSON.stringify(results))
    };
});
});

//show receipt for tower
app.get('/api/receipt/:tower',(req, res) => {
  let sql = "SELECT concat(unit_no,'[',id,']') as id, substring(unit_no,1,1) as tower, unit_no, payment_mode, date, bank_name, rwgst, rgst, receipt_no, status FROM customer_account where substring(unit_no,1,1)="+req.params.tower;
  let query = conn.query(sql, (err, results) => {
      if(err){
        throw err
      }
      else {
        res.send(JSON.stringify(results))
      };
  });
  });

//show demand for tower
app.get('/api/demand/:tower',(req, res) => {
  let sql = "select id, substring(unit_no,1,1) as tower, unit_no, DATE_FORMAT(due_date, '%d-%m-%Y') as due_date, particulars, percentage, net_bsp, gst, net_due, recieved, net_due-recieved as pending_amount from customer_payment_plan where due_date>=now() and due_date is not null and recieved<net_due and substring(unit_no,1,1)="+req.params.tower;
  let query = conn.query(sql, (err, results) => {
      if(err){
        throw err
      }
      else {
        res.send(JSON.stringify(results))
      };
  });
  });

//show reminder for tower
app.get('/api/reminder/:tower',(req, res) => {
  let sql = "select id, substring(unit_no,1,1) as tower, unit_no, DATE_FORMAT(due_date, '%d-%m-%Y') as due_date, particulars, percentage, net_bsp, gst, net_due, recieved, net_due-recieved as pending_amount from customer_payment_plan where due_date<now() and due_date is not null and recieved<net_due and substring(unit_no,1,1)="+req.params.tower;
  let query = conn.query(sql, (err, results) => {
      if(err){
        throw err
      }
      else {
        res.send(JSON.stringify(results))
      };
  });
  });

//show reportDR for tower
app.get('/api/reportDR/:tower',(req, res) => {
  let sql = "select if(due_date<now(), count(unit_no), 0) as total_reminders, if(due_date>=now(), count(unit_no), 0) as total_demand, count(unit_no) as total from customer_payment_plan where due_date is not null and recieved<net_due and substring(unit_no,1,1)="+req.params.tower;
  let query = conn.query(sql, (err, results) => {
      if(err){
        throw err
      }
      else {
        res.send(JSON.stringify(results))
      };
  });
  });

//show reportR for tower
app.get('/api/reportR/:tower',(req, res) => {
  let sql = "select if(status=0, count(unit_no), 0) as pending, if(status=1, count(unit_no), 0) as approved, count(unit_no) as total from customer_account where substring(unit_no,1,1)="+req.params.tower;
  let query = conn.query(sql, (err, results) => {
      if(err){
        throw err
      }
      else {
        res.send(JSON.stringify(results))
      };
  });
  });

//show main for single unit
app.get('/api/main/:tower/:unit_no',(req, res) => {
let sql = "select s_no, tower, booking_date, cb.unit_no, area_sqft, name, mob_no, email, broker, plan, loan, rate, nbp, gst, tbc, tdtd, rwgst, if(rwgst*0.05>ifnull(rgst, 0)>0, rgst, rwgst*0.05) as rgst, if(rwgst*0.05>ifnull(rgst, 0)>0, rwgst-rgst, rwgst-rwgst*0.05) as rwogst, rwgst*100/tbc as rec_per, tbc-rwgst as balance, tdtd-rwgst as o_t from(select s_no, booking_date, tower, unit_no, area_sqft, name, mob_no, email, broker, plan, loan, if(nbp=0, tbc/area_sqft, nbp/area_sqft) as rate, if(nbp=0, tbc-tbc*5/105, nbp) as nbp, if(nbp=0, tbc*5/105, nbp*0.05) as gst, if(tbc=0, nbp+nbp*0.05, tbc) as tbc, if(tbc=0, (nbp+nbp*0.05)*0.4, tbc*0.4) as tdtd from customer)cb left join (select unit_no, sum(rwgst) as rwgst, sum(rgst) as rgst from customer_account group by unit_no)cba on cb.unit_no=cba.unit_no where tower="+req.params.tower+" and cb.unit_no="+req.params.unit_no;
let query = conn.query(sql, (err, results) => {
  if(err){
    throw err
  }
  else {
    res.send(JSON.stringify(results))
  };
});
});

//show receipt for single unit
app.get('/api/receipt/:tower/:unit_no',(req, res) => {
  let sql = "SELECT concat(unit_no,'[',id,']') as id, substring(unit_no,1,1) as tower, unit_no, payment_mode, date, bank_name, rwgst, rgst, receipt_no, status FROM customer_account where substring(unit_no,1,1)="+req.params.tower+" and unit_no="+req.params.unit_no;
  let query = conn.query(sql, (err, results) => {
    if(err){
      throw err
    }
    else {
      res.send(JSON.stringify(results))
    };
  });
  });

//show demand for single unit
app.get('/api/demand/:tower/:unit_no',(req, res) => {
  let sql = "select id, substring(unit_no,1,1) as tower, unit_no, DATE_FORMAT(due_date, '%d-%m-%Y') as due_date, particulars, percentage, net_bsp, gst, net_due, recieved, net_due-recieved as pending_amount from customer_payment_plan where due_date>=now() and due_date is not null and recieved<net_due and substring(unit_no,1,1)="+req.params.tower+" and unit_no="+req.params.unit_no;
  let query = conn.query(sql, (err, results) => {
    if(err){
      throw err
    }
    else {
      res.send(JSON.stringify(results))
    };
  });
  });

//show reminder for single unit
app.get('/api/reminder/:tower/:unit_no',(req, res) => {
  let sql = "select id, substring(unit_no,1,1) as tower, unit_no, DATE_FORMAT(due_date, '%d-%m-%Y') as due_date, particulars, percentage, net_bsp, gst, net_due, recieved, net_due-recieved as pending_amount from customer_payment_plan where due_date<now() and due_date is not null and recieved<net_due and substring(unit_no,1,1)="+req.params.tower+" and unit_no="+req.params.unit_no;
  let query = conn.query(sql, (err, results) => {
    if(err){
      throw err
    }
    else {
      res.send(JSON.stringify(results))
    };
  });
  });

//show reportDR for single unit
app.get('/api/reportDR/:tower/:unit_no',(req, res) => {
  let sql = "select if(due_date<now(), count(unit_no), 0) as total_reminders, if(due_date>=now(), count(unit_no), 0) as total_demand, count(unit_no) as total from customer_payment_plan where due_date is not null and recieved<net_due and substring(unit_no,1,1)="+req.params.tower+" and unit_no="+req.params.unit_no;
  let query = conn.query(sql, (err, results) => {
    if(err){
      throw err
    }
    else {
      res.send(JSON.stringify(results))
    };
  });
  });

//show reportR for single unit
app.get('/api/reportR/:tower/:unit_no',(req, res) => {
  let sql = "select if(status=0, count(unit_no), 0) as pending, if(status=1, count(unit_no), 0) as approved, count(unit_no) as total from customer_account where substring(unit_no,1,1)="+req.params.tower+" and unit_no="+req.params.unit_no;
  let query = conn.query(sql, (err, results) => {
    if(err){
      throw err
    }
    else {
      res.send(JSON.stringify(results))
    };
  });
  });

//add new unit
app.post('/api/:tower/customer',(req, res) => {
let data = {s_no: req.body.s_no, booking_date: req.body.booking_date, unit_no: req.body.unit_no, area_sqft: req.body.area_sqft, name: req.body.name, mob_no: req.body.mob_no, email: req.body.email, broker: req.body.broker, plan: req.body.plan, loan: req.body.loan, nbp: req.body.nbp, tbc: req.body.tbc, floor: req.body.floor, basement: req.body.basement, tower: req.params.tower};
let sql = "INSERT INTO customer SET ?";
let query = conn.query(sql, data,(err, results) => {
  if(err){
    throw err
  }
  else {
    res.send(JSON.stringify(results))
  };
});
});

//add new payment
app.post('/api/:unit_no/customer_account',(req, res) => {
  let data = {id: req.body.id, unit_no: req.params.unit_no, payment_mode: req.body.payment_mode, date: req.body.date, bank_name: req.body.bank_name, rwgst: req.body.rwgst, rgst: req.body.rgst, status: req.body.status};
  let sql = "INSERT INTO customer_account SET ?";
  let query = conn.query(sql, data,(err, results) => {
    if(err){
      throw err
    }
    else {
      res.send(JSON.stringify(results))
    };
  });
  });

//update payment
app.put('/api/customer_account/:id',(req, res) => {
  let sql = "UPDATE customer_account SET status='"+req.body.status+"' WHERE id="+req.params.id;
  let query = conn.query(sql, (err, results) => {
      if(err){
        throw err
      }
      else {
        res.send(JSON.stringify(results))
      };
    });
  });

//update customer payment due date
app.put('/api/payments/:id',(req, res) => {
let sql = "UPDATE customer_payment_plan SET due_date='"+req.body.due_date+"' WHERE id="+req.params.id;
let query = conn.query(sql, (err, results) => {
    if(err){
      throw err
    }
    else {
      res.send(JSON.stringify(results))
    };
  });
});

// //Delete product
// app.delete('/api/products/:id',(req, res) => {
// let sql = "DELETE FROM product WHERE product_id="+req.params.id+"";
// let query = conn.query(sql, (err, results) => {
//     if(err.message.code==='ETIMEDOUT'){
//         res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
//     }
//     else throw err;
// });
// });

// Server listening
app.listen(80,() =>{
console.log('Server started on port 80...');
});

app.keepAliveTimeout = 61 * 1000;

process.on('uncaughtException', (error, origin) => {
    if (error?.code === 'ECONNRESET') return;
    console.error('UNCAUGHT EXCEPTION');
    console.error(error);
    console.error(origin);
    process.exit(1);
  });