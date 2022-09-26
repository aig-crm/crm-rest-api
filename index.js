const express = require('express');
const bodyParser = require('body-parser');
var app = express();
var mysql = require('mysql');
const cors = require('cors');
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
app.use(cors());

//create database connection
var conn = mysql.createConnection({
    database: 'aig_crm',
    host: "localhost",
    user: "AIGROYAL",
    password: "aig1357!AIG",
    connectTimeout: 60000
  });

//connect to database
conn.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });

//show main
app.get('/api/main',(req, res) => {
  let sql = "select s_no, tower, booking_date, cb.unit_no, area_sqft, applicant_name, applicant_mob_no, applicant_email, coapplicant_name, coapplicant_mob_no, coapplicant_email, broker, plan, loan, round(nbp/area_sqft) as rate, nbp, gst, tbc, tdtd, rwgst, round(if(rwgst*0.05>ifnull(rgst, 0)>0, rgst, rwgst*0.05)) as rgst, round(if(rwgst*0.05>ifnull(rgst, 0)>0, rwgst-rgst, rwgst-rwgst*0.05)) as rwogst, round(rwgst*100/tbc) as rec_per, round(tbc-rwgst) as balance, round(tdtd-rwgst) as o_t, gst_choice, address, aadhar_card, pan_card from(select s_no, booking_date, tower, unit_no->>'$.unit_no' as unit_no, area_sqft->>'$.area_sqft' as area_sqft, applicant_name, applicant_mob_no, applicant_email, coapplicant_name, coapplicant_mob_no, coapplicant_email, broker->>'$.bcn' as broker, plan->>'$.plan' as plan, loan, round(if(nbp=0, tbc-tbc*5/105, nbp)) as nbp, round(if(nbp=0, tbc*5/105, nbp*0.05)) as gst, round(if(tbc=0, nbp+nbp*0.05, tbc)) as tbc, round(if(tbc=0, (nbp+nbp*0.05)*0.4, tbc*0.4)) as tdtd, gst_choice->>'$.gst_choice' as gst_choice, address, aadhar_card, pan_card from customer)cb left join (select unit_no, sum(rwgst) as rwgst, sum(rgst) as rgst from customer_account group by unit_no)cba on cb.unit_no=cba.unit_no order by s_no";
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
  let sql = "SELECT concat(unit_no,'[',id,']') as id, substring(unit_no,1,1) as tower, unit_no, payment_mode, DATE_FORMAT(date, '%d-%m-%Y') as date, bank_name, rwgst, round(if(rwgst*0.05>ifnull(rgst, 0)>0, rwgst-rgst, rwgst-rwgst*0.05)) as rwogst, rgst, receipt_no, status FROM customer_account";
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
  let sql = "select id, substring(unit_no,1,1) as tower, unit_no, DATE_FORMAT(due_date, '%d-%m-%Y') as due_date, description, percentage, net_bsp, gst/2 as cgst, gst/2 as sgst, gst, net_due, recieved, net_due-recieved as pending_amount from customer_payment_plan where due_date>=current_date() and due_date is not null and recieved<net_due";
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
  let sql = "select id, substring(unit_no,1,1) as tower, unit_no, DATE_FORMAT(due_date, '%d-%m-%Y') as due_date, description, percentage, net_bsp, gst/2 as cgst, gst/2 as sgst, gst, net_due, recieved, net_due-recieved as pending_amount from customer_payment_plan where due_date<current_date() and due_date is not null and recieved<net_due";
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
  let sql = "select 'reminder' as params, count(id) as count from customer_payment_plan where due_date is not null and recieved<net_due and due_date<current_date() union select 'demand', count(id) as count from customer_payment_plan where due_date is not null and recieved<net_due and due_date>=current_date()";
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

//show units-count
app.get('/api/unitscount',(req, res) => {
  let sql = "select 'booked' as params, count(unit_no) as count from tower_units where unit_no in (select unit_no->>'$.unit_no' from customer) union select 'empty', count(unit_no) from tower_units where unit_no not in (select unit_no->>'$.unit_no' from customer)";
  let query = conn.query(sql, (err, results) => {
      if(err){
        throw err
      }
      else {
        res.send(JSON.stringify(results))
      };
  });
  });

//show inventory
app.get('/api/inventory',(req, res) => {
  let sql = "select s_no, tower, unit_no, unit_type, area_sqft, 'empty' as param from tower_units where unit_no not in (select unit_no->>'$.unit_no' from customer) union select s_no, tower, unit_no, unit_type, area_sqft, 'booked' as param from tower_units where unit_no in (select unit_no->>'$.unit_no' from customer) order by s_no";
  let query = conn.query(sql, (err, results) => {
      if(err){
        throw err
      }
      else {
        res.send(JSON.stringify(results))
      };
  });
  });

//show unittype-count
app.get('/api/unittypecount',(req, res) => {
  let sql = "select count(tu.unit_no) as total_units, count(c.unit_no) as booked_units, (count(tu.unit_no)-count(c.unit_no)) as empty_units, tu.unit_type from tower_units tu left join (select unit_no->>'$.unit_no' as unit_no from customer)c on tu.unit_no=c.unit_no group by tu.unit_type";
  let query = conn.query(sql, (err, results) => {
      if(err){
        throw err
      }
      else {
        res.send(JSON.stringify(results))
      };
  });
  });

//show gst_choice
app.get('/api/gst_choice',(req, res) => {
  let sql = "select * from gst_choice";
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
let sql = "select s_no, tower, booking_date, cb.unit_no, area_sqft, applicant_name, applicant_mob_no, applicant_email, coapplicant_name, coapplicant_mob_no, coapplicant_email, broker, plan, loan, round(nbp/area_sqft) as rate, nbp, gst, tbc, tdtd, rwgst, round(if(rwgst*0.05>ifnull(rgst, 0)>0, rgst, rwgst*0.05)) as rgst, round(if(rwgst*0.05>ifnull(rgst, 0)>0, rwgst-rgst, rwgst-rwgst*0.05)) as rwogst, round(rwgst*100/tbc) as rec_per, round(tbc-rwgst) as balance, round(tdtd-rwgst) as o_t, gst_choice, address, aadhar_card, pan_card from(select s_no, booking_date, tower, unit_no->>'$.unit_no' as unit_no, area_sqft->>'$.area_sqft' as area_sqft, applicant_name, applicant_mob_no, applicant_email, coapplicant_name, coapplicant_mob_no, coapplicant_email, broker->>'$.bcn' as broker, plan->>'$.plan' as plan, loan, round(if(nbp=0, tbc-tbc*5/105, nbp)) as nbp, round(if(nbp=0, tbc*5/105, nbp*0.05)) as gst, round(if(tbc=0, nbp+nbp*0.05, tbc)) as tbc, round(if(tbc=0, (nbp+nbp*0.05)*0.4, tbc*0.4)) as tdtd, gst_choice->>'$.gst_choice' as gst_choice, address, aadhar_card, pan_card from customer)cb left join (select unit_no, sum(rwgst) as rwgst, sum(rgst) as rgst from customer_account group by unit_no)cba on cb.unit_no=cba.unit_no where tower="+req.params.tower+"order by s_no";
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
  let sql = "SELECT concat(unit_no,'[',id,']') as id, substring(unit_no,1,1) as tower, unit_no, payment_mode, DATE_FORMAT(date, '%d-%m-%Y') as date, bank_name, rwgst, round(if(rwgst*0.05>ifnull(rgst, 0)>0, rwgst-rgst, rwgst-rwgst*0.05)) as rwogst, rgst, receipt_no, status FROM customer_account where substring(unit_no,1,1)="+req.params.tower;
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
  let sql = "select id, substring(unit_no,1,1) as tower, unit_no, DATE_FORMAT(due_date, '%d-%m-%Y') as due_date, description, percentage, net_bsp, gst/2 as cgst, gst/2 as sgst, gst, net_due, recieved, net_due-recieved as pending_amount from customer_payment_plan where due_date>=current_date() and due_date is not null and recieved<net_due and substring(unit_no,1,1)="+req.params.tower;
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
  let sql = "select id, substring(unit_no,1,1) as tower, unit_no, DATE_FORMAT(due_date, '%d-%m-%Y') as due_date, description, percentage, net_bsp, gst/2 as cgst, gst/2 as sgst, gst, net_due, recieved, net_due-recieved as pending_amount from customer_payment_plan where due_date<current_date() and due_date is not null and recieved<net_due and substring(unit_no,1,1)="+req.params.tower;
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
  let sql = "select 'reminder' as params, count(id) as count from customer_payment_plan where due_date is not null and recieved<net_due and due_date<current_date() and substring(unit_no,1,1)="+req.params.tower+" union select 'demand', count(id) as count from customer_payment_plan where due_date is not null and recieved<net_due and due_date>=current_date() and substring(unit_no,1,1)="+req.params.tower;
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

//show units-count for tower
app.get('/api/unitscount/:tower',(req, res) => {
  let sql = "select 'booked' as params, count(unit_no) as count from tower_units where unit_no in (select unit_no->>'$.unit_no' from customer) and tower="+req.params.tower+" union select 'empty', count(unit_no) from tower_units where unit_no not in (select unit_no->>'$.unit_no' from customer) and tower="+req.params.tower;
  let query = conn.query(sql, (err, results) => {
      if(err){
        throw err
      }
      else {
        res.send(JSON.stringify(results))
      };
  });
  });

//show inventory for tower
app.get('/api/inventory/:tower',(req, res) => {
  let sql = "select s_no, tower, unit_no, unit_type, area_sqft, 'empty' as param from tower_units where unit_no not in (select unit_no->>'$.unit_no' from customer) and tower="+req.params.tower+" union select s_no, tower, unit_no, unit_type, area_sqft, 'booked' as param from tower_units where unit_no in (select unit_no->>'$.unit_no' from customer) and tower="+req.params.tower+" order by s_no";
  let query = conn.query(sql, (err, results) => {
      if(err){
        throw err
      }
      else {
        res.send(JSON.stringify(results))
      };
  });
  });

//show unittype-count for tower
app.get('/api/unittypecount/:tower',(req, res) => {
  let sql = "select count(tu.unit_no) as total_units, count(c.unit_no) as booked_units, (count(tu.unit_no)-count(c.unit_no)) as empty_units, tu.unit_type from tower_units tu left join (select unit_no->>'$.unit_no' as unit_no from customer)c on tu.unit_no=c.unit_no where tu.tower="+req.params.tower+" group by tu.unit_type";
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
let sql = "select s_no, tower, booking_date, cb.unit_no, area_sqft, applicant_name, applicant_mob_no, applicant_email, coapplicant_name, coapplicant_mob_no, coapplicant_email, broker, plan, loan, round(nbp/area_sqft) as rate, nbp, gst, tbc, tdtd, rwgst, round(if(rwgst*0.05>ifnull(rgst, 0)>0, rgst, rwgst*0.05)) as rgst, round(if(rwgst*0.05>ifnull(rgst, 0)>0, rwgst-rgst, rwgst-rwgst*0.05)) as rwogst, round(rwgst*100/tbc) as rec_per, round(tbc-rwgst) as balance, round(tdtd-rwgst) as o_t, gst_choice, address, aadhar_card, pan_card from(select s_no, booking_date, tower, unit_no->>'$.unit_no' as unit_no, area_sqft->>'$.area_sqft' as area_sqft, applicant_name, applicant_mob_no, applicant_email, coapplicant_name, coapplicant_mob_no, coapplicant_email, broker->>'$.bcn' as broker, plan->>'$.plan' as plan, loan, round(if(nbp=0, tbc-tbc*5/105, nbp)) as nbp, round(if(nbp=0, tbc*5/105, nbp*0.05)) as gst, round(if(tbc=0, nbp+nbp*0.05, tbc)) as tbc, round(if(tbc=0, (nbp+nbp*0.05)*0.4, tbc*0.4)) as tdtd, gst_choice->>'$.gst_choice' as gst_choice, address, aadhar_card, pan_card from customer)cb left join (select unit_no, sum(rwgst) as rwgst, sum(rgst) as rgst from customer_account group by unit_no)cba on cb.unit_no=cba.unit_no where tower="+req.params.tower+" and cb.unit_no="+req.params.unit_no+"order by s_no";
let query = conn.query(sql, (err, results) => {
  if(err){
    throw err
  }
  else {
    res.send(JSON.stringify(results))
  };
});
});

//show receipt for single unit receipt_pending
app.get('/api/receipt_pending/:tower/:unit_no',(req, res) => {
  let sql = "SELECT concat(unit_no,'[',id,']') as id, substring(unit_no,1,1) as tower, unit_no, payment_mode, DATE_FORMAT(date, '%d-%m-%Y') as date, bank_name, rwgst, round(if(rwgst*0.05>ifnull(rgst, 0)>0, rwgst-rgst, rwgst-rwgst*0.05)) as rwogst, rgst, receipt_no, if(status=0, 'Pending', '') as status, clearing_bank, DATE_FORMAT(clearing_date, '%d-%m-%Y') as clearing_date FROM customer_account where status=0 and substring(unit_no,1,1)="+req.params.tower+" and unit_no="+req.params.unit_no;
  let query = conn.query(sql, (err, results) => {
    if(err){
      throw err
    }
    else {
      res.send(JSON.stringify(results))
    };
  });
  });

//show receipt for single unit receipt_approved
app.get('/api/receipt_approved/:tower/:unit_no',(req, res) => {
  let sql = "SELECT concat(unit_no,'[',id,']') as id, substring(unit_no,1,1) as tower, unit_no, payment_mode, DATE_FORMAT(date, '%d-%m-%Y') as date, bank_name, rwgst, round(if(rwgst*0.05>ifnull(rgst, 0)>0, rwgst-rgst, rwgst-rwgst*0.05)) as rwogst, rgst, receipt_no, if(status=1, 'Approved', '') as status, clearing_bank, DATE_FORMAT(clearing_date, '%d-%m-%Y') as clearing_date FROM customer_account where status=1 and substring(unit_no,1,1)="+req.params.tower+" and unit_no="+req.params.unit_no;
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
  let sql = "select id, substring(unit_no,1,1) as tower, unit_no, DATE_FORMAT(due_date, '%d-%m-%Y') as due_date, description, percentage, net_bsp, gst/2 as cgst, gst/2 as sgst, gst, net_due, recieved, 0-recieved as pending_amount from customer_payment_plan where due_date>=current_date() and due_date is not null and recieved<net_due and substring(unit_no,1,1)="+req.params.tower+" and unit_no="+req.params.unit_no;
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
  let sql = "select id, substring(unit_no,1,1) as tower, unit_no, DATE_FORMAT(due_date, '%d-%m-%Y') as due_date, description, percentage, net_bsp, gst/2 as cgst, gst/2 as sgst, gst, net_due, recieved, net_due-recieved as pending_amount from customer_payment_plan where recieved=net_due and substring(unit_no,1,1)="+req.params.tower+" and unit_no="+req.params.unit_no + " union select id, substring(unit_no,1,1) as tower, unit_no, DATE_FORMAT(due_date, '%d-%m-%Y') as due_date, description, percentage, net_bsp, gst/2 as cgst, gst/2 as sgst, gst, net_due, recieved, net_due-recieved as pending_amount from customer_payment_plan where due_date<current_date() and due_date is not null and recieved<net_due and substring(unit_no,1,1)="+req.params.tower+" and unit_no="+req.params.unit_no;
  let query = conn.query(sql, (err, results) => {
    if(err){
      throw err
    }
    else {
      res.send(JSON.stringify(results))
    };
  });
  });

//show demand-reminder for specific id
app.get('/api/demandR/:id',(req, res) => {
  let sql = "select id, substring(unit_no,1,1) as tower, unit_no, DATE_FORMAT(due_date, '%d-%m-%Y') as due_date, description, percentage, net_bsp, gst/2 as cgst, gst/2 as sgst, gst, net_due, recieved, net_due-recieved as pending_amount from customer_payment_plan where due_date is not null and recieved<net_due and id="+req.params.id;
  let query = conn.query(sql, (err, results) => {
    if(err){
      throw err
    }
    else {
      res.send(JSON.stringify(results))
    };
  });
  });

  //show total for demand-reminder for specific id
app.get('/api/total/:tower/:unit_no',(req, res) => {
  let sql = "select 'TOTAL' as description, '' as due_date, sum(net_bsp) as net_bsp, sum(gst/2) as cgst, sum(gst/2) as sgst, sum(gst) as gst, sum(net_due) as net_due, sum(recieved) as recieved, sum(pending_amount) as pending_amount from (select id, substring(unit_no,1,1) as tower, unit_no, DATE_FORMAT(due_date, '%d-%m-%Y') as due_date, description, percentage, net_bsp, gst/2 as cgst, gst/2 as sgst, gst, net_due, recieved, net_due-recieved as pending_amount from customer_payment_plan where recieved=net_due and substring(unit_no,1,1)="+req.params.tower+" and unit_no="+req.params.unit_no+" union select id, substring(unit_no,1,1) as tower, unit_no, DATE_FORMAT(due_date, '%d-%m-%Y') as due_date, description, percentage, net_bsp, gst/2 as cgst, gst/2 as sgst, gst, net_due, recieved, net_due-recieved as pending_amount from customer_payment_plan where due_date<current_date() and due_date is not null and recieved<net_due and substring(unit_no,1,1)="+req.params.tower+" and unit_no="+req.params.unit_no+" union select id, substring(unit_no,1,1) as tower, unit_no, DATE_FORMAT(due_date, '%d-%m-%Y') as due_date, description, percentage, net_bsp, gst/2 as cgst, gst/2 as sgst, gst, net_due, recieved, 0-recieved as pending_amount from customer_payment_plan where due_date>=current_date() and due_date is not null and recieved<net_due and substring(unit_no,1,1)="+req.params.tower+" and unit_no="+req.params.unit_no +") main";
  let query = conn.query(sql, (err, results) => {
    if(err){
      throw err
    }
    else {
      res.send(JSON.stringify(results))
    };
  });
  });

//show customer_payment_plan for single unit
app.get('/api/cpp/:tower/:unit_no',(req, res) => {
  let sql = "select id, substring(unit_no,1,1) as tower, unit_no, DATE_FORMAT(due_date, '%d-%m-%Y') as due_date, description, percentage, net_bsp, gst/2 as cgst, gst/2 as sgst, gst, net_due as due, 0 as net_due, recieved, 0 as pending_amount from customer_payment_plan where due_date is null and recieved<net_due and substring(unit_no,1,1)="+req.params.tower+" and unit_no="+req.params.unit_no;
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
  let sql = "select 'reminder' as params, count(id) as count from customer_payment_plan where due_date is not null and recieved<net_due and due_date<current_date() and substring(unit_no,1,1)="+req.params.tower+" and unit_no="+req.params.unit_no+" union select 'demand', count(id) as count from customer_payment_plan where due_date is not null and recieved<net_due and due_date>=current_date() and substring(unit_no,1,1)="+req.params.tower+" and unit_no="+req.params.unit_no;
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

//BOOKING API- gst_choice of unit_no booked
app.get('/api/bookingApi/gst_choice/:tower/:unit_no',(req, res) => {
  let sql = "select m.gst_choice from tower_units tu inner join (select unit_no->>'$.unit_no' as unit_no, gst_choice->>'$.gst_choice' as gst_choice from customer)m on m.unit_no=tu.unit_no where tu.tower="+req.params.tower+" and tu.unit_no="+req.params.unit_no;
  let query = conn.query(sql, (err, results) => {
    if(err){
      throw err
    }
    else {
      res.send(JSON.stringify(results))
    };
  });
  });

//BOOKING API- unit_no booked
app.get('/api/bookingApi/booked_units/:tower',(req, res) => {
  let sql = "select tu.unit_no, m.gst_choice from tower_units tu inner join (select unit_no->>'$.unit_no' as unit_no, gst_choice->>'$.gst_choice' as gst_choice from customer)m on m.unit_no=tu.unit_no where tu.tower="+req.params.tower;
  let query = conn.query(sql, (err, results) => {
    if(err){
      throw err
    }
    else {
      res.send(JSON.stringify(results))
    };
  });
  });

//BOOKING API- unit_no available
app.get('/api/bookingApi/unit_no/:tower',(req, res) => {
  let sql = "select unit_no from tower_units where unit_no not in(select unit_no->>'$.unit_no' from customer) and tower="+req.params.tower;
  let query = conn.query(sql, (err, results) => {
    if(err){
      throw err
    }
    else {
      res.send(JSON.stringify(results))
    };
  });
  });

//BOOKING API- area_sqft available
app.get('/api/bookingApi/area_sqft/:tower',(req, res) => {
  let sql = "select distinct area_sqft from tower_units where unit_no not in(select unit_no->>'$.unit_no' from customer) and tower="+req.params.tower;
  let query = conn.query(sql, (err, results) => {
    if(err){
      throw err
    }
    else {
      res.send(JSON.stringify(results))
    };
  });
  });

//BOOKING API- payment_plan available
app.get('/api/bookingApi/payment_plan',(req, res) => {
  let sql = "select distinct plan from payment_plan";
  let query = conn.query(sql, (err, results) => {
    if(err){
      throw err
    }
    else {
      res.send(JSON.stringify(results))
    };
  });
  });

//BOOKING API- broker available
app.get('/api/bookingApi/broker',(req, res) => {
  let sql = "select bcn from brokers";
  let query = conn.query(sql, (err, results) => {
    if(err){
      throw err
    }
    else {
      res.send(JSON.stringify(results))
    };
  });
  });

//show canceled bookings
app.get('/api/cbookings',(req, res) => {
  let sql = "select s_no, booking_date, unit_no, area_sqft, applicant_name, applicant_mob_no, applicant_email, broker, plan, loan, nbp, tbc, tower, coapplicant_name, coapplicant_mob_no, coapplicant_email, amt, remarks from cancel_bookings order by s_no";
  let query = conn.query(sql, (err, results) => {
      if(err){
        throw err
      }
      else {
        res.send(JSON.stringify(results))
      };
  });
  });

//show canceled bookings for tower
app.get('/api/cbookings/:tower',(req, res) => {
  let sql = "select s_no, booking_date, unit_no, area_sqft, applicant_name, applicant_mob_no, applicant_email, broker, plan, loan, nbp, tbc, tower, coapplicant_name, coapplicant_mob_no, coapplicant_email, amt, remarks from cancel_bookings where tower="+req.params.tower+"order by s_no";
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
app.post('/api/customer',(req, res) => {
let data = {s_no: req.body.s_no, booking_date: req.body.booking_date, unit_no: req.body.unit_no, area_sqft: req.body.area_sqft, applicant_name: req.body.applicant_name, applicant_mob_no: req.body.applicant_mob_no, applicant_email: req.body.applicant_email, coapplicant_name: req.body.coapplicant_name, coapplicant_mob_no: req.body.coapplicant_mob_no, coapplicant_email: req.body.coapplicant_email, broker: req.body.broker, plan: req.body.plan, loan: req.body.loan, nbp: req.body.nbp, tbc: req.body.tbc, floor: req.body.floor, basement: req.body.basement, tower: req.body.tower, aadhar_card: req.body.aadhar_card, address: req.body.address, gst_choice: req.body.gst_choice, pan_card: req.body.pan_card};
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

//add cancel unit
app.post('/api/cancel_booking/:unit_no',(req, res) => {
  let data = {s_no: req.body.s_no, booking_date: req.body.booking_date, unit_no: req.body.unit_no, area_sqft: req.body.area_sqft, applicant_name: req.body.applicant_name, applicant_mob_no: req.body.applicant_mob_no, applicant_email: req.body.applicant_email, coapplicant_name: req.body.coapplicant_name, coapplicant_mob_no: req.body.coapplicant_mob_no, coapplicant_email: req.body.coapplicant_email, broker: req.body.broker, plan: req.body.plan, loan: req.body.loan, nbp: req.body.nbp, tbc: req.body.tbc, tower: req.body.tower, amt: req.body.amt, remarks: req.body.remarks};
  let sql = "INSERT INTO cancel_bookings SET ?";
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
  let data = {id: req.body.id, unit_no: req.params.unit_no, payment_mode: req.body.payment_mode, date: req.body.date, bank_name: req.body.bank_name, rwgst: req.body.rwgst, rgst: req.body.rgst, receipt_no: req.body.receipt_no, status: 0, bank_branch: req.body.bank_branch, ref_no: req.body.ref_no};
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

//login admin
app.post('/api/admin',(req, res) => {
  let data = {username: req.body.username, password: req.body.password, flag: req.body.flag};
  let sql = "SELECT * FROM users where username=? and password=? and flag=1";
  let query = conn.query(sql, data,(err, results) => {
    if(err){
      throw err
    }
    if(results) {
      res.send(JSON.stringify(results));
    }else{
      res.send({message: "Wrong credentials!"})
    };
  });
  });

//login crm
app.post('/api/crm',(req, res) => {
  let data = {username: req.body.username, password: req.body.password, flag: req.body.flag};
  let sql = "SELECT * FROM users where username=? and password=? and flag=0";
  let query = conn.query(sql, data,(err, results) => {
    if(err){
      throw err
    }
    if(results) {
      res.send(JSON.stringify(results));
    }else{
      res.send({message: "Wrong credentials!"})
    };
  });
  });

//update payment (for status only)
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

//update payment 
app.put('/api/receipt_edit/:receipt_no',(req, res) => {
  let sql = "UPDATE customer_account SET payment_mode='"+req.body.payment_mode+"', bank_name='"+req.body.bank_name+"', rwgst="+req.body.rwgst+", rgst="+req.body.rgst+" WHERE receipt_no="+req.params.receipt_no;
  let query = conn.query(sql, (err, results) => {
      if(err){
        throw err
      }
      else {
        res.send(JSON.stringify(results))
      };
    });
  });

//delete payment 
app.delete('/api/receipt_delete/:receipt_no',(req, res) => {
  let sql = "delete from customer_account WHERE receipt_no="+req.params.receipt_no;
  let query = conn.query(sql, (err, results) => {
      if(err){
        throw err
      }
      else {
        res.send(JSON.stringify(results))
      };
    });
  });

//delete booking 
app.delete('/api/booking_delete/:unit_no',(req, res) => {
  let sql = "delete from customer WHERE unit_no->>'$.unit_no'="+req.params.unit_no;
  let query = conn.query(sql, (err, results) => {
      if(err){
        throw err
      }
      else {
        res.send(JSON.stringify(results))
      };
    });
  });

//delete customer payment plan 
app.delete('/api/cpp_delete/:unit_no',(req, res) => {
  let sql = "delete from customer_payment_plan WHERE unit_no="+req.params.unit_no;
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

app.get('/api/arr/:unit_no',(req, res) => {
  a1=[];
  a2=[];
  desc=[];
  d1=[];
  d2=[];
  r1=[];
  u1=[];
  arr3 = [[]];
  let sql = "select id, net_due, ifnull(due_date, '') as due_date, description from customer_payment_plan where unit_no="+req.params.unit_no;
  conn.query(sql, (err, results) => {
    if(err){
      throw err
    }
    else {
      let newArray = results.map((row) => {
        return row.net_due;
      })
      let newArrayDate = results.map((row) => {
        return row.due_date;
      })
      let newArrayDesc = results.map((row) => {
        return row.description;
      })
      desc = newArrayDesc;
      a1 = newArray;
      d1 = newArrayDate;
      let sql = "select id, rwgst, ifnull(date,'') as date, receipt_no, unit_no from customer_account where unit_no="+req.params.unit_no+"order by date";
      conn.query(sql, (err, results) => {
        if(err){
          throw err
        }
        else {
          let newArray = results.map((row) => {
            return row.rwgst;
          })
          let newArrayDate = results.map((row) => {
            return row.date;
          })
          let newArrayReceipt = results.map((row) => {
            return row.receipt_no;
          })
          let newArrayUnit = results.map((row) => {
            return row.unit_no;
          })
          a2 = newArray;
          d2 = newArrayDate;
          r1 = newArrayReceipt;
          u1 = newArrayUnit;
          i1 = 0;
          i2 = 0;
          while (i1 < a1.length && i2 < a2.length) {
            if (a1[i1] < a2[i2]) {
              arr3[i2].push('{"id": ' + '"' + r1[i2] + '-' + a2[i2] + '"' + ',' + '"unit_no": ' + '"' + u1[i1] + '"' + ',' + '"description": ' + '"' + desc[i1] + '"' + ',' + '"due_amt": ' + '"' + a1[i1] + '"' + ',' + '"due_date": ' + '"' + d1[i1] + '"' + ',' + '"received_date": ' + '"' + d2[i2] + '"' + ',' + '"required_amt": ' + '"' + a1[i1] + '"' + ',' + '"received_amt": ' + '"' + a2[i2] + '"' +'}');
              a2[i2]=a2[i2]-a1[i1];
            }
            else{
              arr3[i2].push('{"id": ' + '"' + r1[i2] + '-' + a2[i2] + '"' + ',' + '"unit_no": ' + '"' + u1[i1] + '"' + ',' + '"description": ' + '"' + desc[i1] + '"' + ',' + '"due_amt": ' + '"' + a1[i1] + '"' + ',' + '"due_date": ' + '"' + d1[i1] + '"' + ',' + '"received_date": ' + '"' + d2[i2] + '"' + ',' + '"required_amt": ' + '"' + a2[i2] + '"' + ',' + '"received_amt": ' + '"' + a2[i2] + '"' +'}');
              a1[i1]=a1[i1]-a2[i2];
              a2[i2]=0;
              i1--;
            }
            i1++;
            if (a2[i2]==0) {
              i2++;
              arr3.push([]);
            }
          }
          const element = [];
          arr3.forEach((item)=>{
              if(item.length>1){
                  item.forEach((ele)=>{
                    element.push(JSON.parse(ele));
                  })
              }
              else if(item.length==0){
                element.push({})
              }
              else{
                element.push(JSON.parse(item[0]));
              }
          })
          res.send(element);
        };
      });
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