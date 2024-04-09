const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const LogicHandler = require('./logic-handler')

require("dotenv").config();



app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(process.env.PORT || 4000, async (req, res) => {
  console.log("node server is listening");
});

app.get("/", (req, res) => {
  return res
    .json({
      message: "welcome to folder creator",
    })
    .status(200);
});


app.post('/api/command', (req,res,err)=>new LogicHandler(req,res))

app.use('*', (req,res,err)=>{
  res.json({
    status:false,
    message:'Path not found'
  }).status(500)
})
