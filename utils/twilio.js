
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN
const serviceSid = process.env.TWILIO_SERVICE_SID;
const client = require("twilio")(accountSid, authToken);


module.exports={
    sendOtp : (mobile) =>{
        return new Promise((resolve, reject) =>{
            client.verify.v2.services(serviceSid)
            .verifications
            .create({to:`+91${mobile}`, channel: 'sms'})
            .then(verification => {
                console.log(verification.status)
                resolve(verification.status)
            });
        })
    },

    verifyOtp : (mobile, otp) =>{
        return new Promise((resolve, reject) =>{
            client.verify.v2.services(serviceSid)
            .verificationChecks
            .create({to: `+91${mobile}`, code: `${otp}`})
            .then(verification_check => {
                console.log(verification_check.status)
              
                    resolve(verification_check.status);                
            });
        })
    }
}


// client.verify.v2
//   .services(verifySid)
//   .verifications.create({ to: "+917510630130", channel: "sms" })
//   .then((verification) => console.log(verification.status))
//   .then(() => {
//     const readline = require("readline").createInterface({
//       input: process.stdin,
//       output: process.stdout,
//     });
//     readline.question("Please enter the OTP:", (otpCode) => {
//       client.verify.v2
//         .services(verifySid)
//         .verificationChecks.create({ to: "+917510630130", code: otpCode })
//         .then((verification_check) => console.log(verification_check.status))
//         .then(() => readline.close());
//     });
//   });