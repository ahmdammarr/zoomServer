require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const rp = require('request-promise');

const app = express()
const port = 5000

app.use(bodyParser.json(), cors())
app.options('*', cors());
app.use(express.urlencoded({ extended: true }));


const token = jwt.sign({ 
  "iss": process.env.ZOOM_JWT_API_KEY,
  "exp": 1496091964000
}, process.env.ZOOM_JWT_API_SECRET);
console.log('process.env.ZOOM_JWT_API_KEY',process.env.ZOOM_JWT_API_KEY)
app.post('/createMeeting', (req, res) => {
  const options = {
    method: 'POST',
    url: `https://api.zoom.us/v2/users/${req.body.userId}/meetings`,
    headers: {'content-type': 'application/json', authorization: `Bearer ${token}`},
    body: {
      topic: 'Demo Meeting 1',
      type: 1,
      start_time: `${Date.now().toString()}Z`,
      agenda: 'This is the meeting description',
      settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          mute_upon_entry: true,
          use_pmi: false,
          approval_type: 0
      }
    },
    json: true
  };

rp(options)
    .then( (response)=> {
        console.log('meeting', response);
        res.json({
          meeting: response
        })
        
    })
    .catch( (err)=> {
        console.log('API call failed, reason ', err);
    });
})

app.post('/createHrHost', (req, res) => {
  const options = {
    method: 'POST',
    url: 'https://api.zoom.us/v2/users',
    headers: {'content-type': 'application/json', authorization: `Bearer ${token}`}, 
    body: {
     "action": "custCreate",
     "user_info": {
       "email": req.body.email,
       "type": 1,
       "first_name": req.body.firstName,
       "last_name": req.body.lastName
     }
  },
    json: true
  };

rp(options)
    .then( (response)=> {
        console.log('user', response);
        res.json({
          user: response
        })
        
    })
    .catch( (err)=> {
        console.log('API call failed, reason ', err);
    });
})

app.post('/test', (req, res) => {
  res.json({
    test: 'test'
  })
})


app.post('/', (req, res) => {
  const timestamp = new Date().getTime() - 30000
  const msg = Buffer.from(process.env.ZOOM_JWT_API_KEY + req.body.meetingNumber + timestamp + req.body.role).toString('base64')
  const hash = crypto.createHmac('sha256', process.env.ZOOM_JWT_API_SECRET).update(msg).digest('base64')
  const signature = Buffer.from(`${process.env.ZOOM_JWT_API_KEY}.${req.body.meetingNumber}.${timestamp}.${req.body.role}.${hash}`).toString('base64')

  res.json({
    signature: signature
  })
})

app.listen(port, () => console.log(`Zoom Web Meeting SDK Sample Signature Node.js on port ${port}!`))
