const nodemailer = require('nodemailer');

// Configuration
const URL = "https://app.squarespacescheduling.com/api/scheduling/v1/availability/class"
const USER_URL = "https://www.madkoestergreen.com/queer-fight-club"
const emails = [
    "john_williams@sidetrail.io",
    "andiebrown1@gmail.com",
    "conclaudius@gmail.com"
]


const appointmentTypes = [ // Beginner and Free Beginner classes
    88392556,
    91175365
]


const calendars = [
    9628336
]

const data = {
    "owner": "10e79939",
    "timezone": "America/Chicago",
    "bookableAppointmentTypeIds": appointmentTypes,
    "bookableCalendarIds": calendars,
    "calendarIds": calendars,
    "limit": 15,
    "offset": 0
}

//configure email sender

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "j0hntw1ll1ams95@gmail.com",
        pass: process.env.GOOGLE_APP_PASSWORD, // The 16-character App Password
    },
});

const sendEmails = (emails, appointments) => emails.map(email => {
    const availableSlots = appointments?.map(appointment => appointment.slotsAvailable).reduce((acc, slotsAvailable) => acc + slotsAvailable, 0);
    if (availableSlots > 10) {
        console.log(`new batch of ${appointments?.length} appointments found`)
        return {...mailForNewBatchTemplate(appointments), to: email}
    }
    if (availableSlots > 0) {
        console.log(`${appointments?.length} new days found`)
        return {...mailForPiecemealTemplate(appointments), to: email}
    }
    console.log("No appointments found")
    return null;
}).filter(mailOption => mailOption).forEach(mailOption => sendMail(mailOption))


const mailForNewBatchTemplate = (appointments) => (
    {
        from: '"John Williams" <john_williams@sidetrail.io>',
        subject: 'Looks like QFC just opened a new batch of classes!',
        text: 'Looks like QFC just opened a new batch of classes!',
        html: `
<b>Looks like QFC just opened a new batch of classes!</b>
<br/>
<p>There are ${appointments?.length} new days available with ${appointments?.map(appointment => appointment.slotsAvailable).reduce((acc, slotsAvailable) => acc + slotsAvailable, 0)} slots</p>
<br />
<p>The following days are available:</p>
<br/>
${appointments?.map(appointment => `<b>${appointment.humanDate}: ${appointment.slotsAvailable} slots</b>`).join('<br/>')}
<br/>
<p>Click <a href="${USER_URL}">here</a> to book a class!</p>`
    });

const mailForPiecemealTemplate = (appointments) => (
    {
        from: '"John Williams" <john_williams@sidetrail.io>',
        subject: 'QFC has some new slots!',
        text: 'QFC has some new slots!',
        html: `
<b>Looks like QFC has a few open slots for beginners!</b>
<br/>
<p>There are ${appointments?.length} days available with ${appointments?.map(appointment => appointment.slotsAvailable).reduce((acc, slotsAvailable) => acc + slotsAvailable, 0)} slots</p>
<br />
<p>The following days are available:</p>
<br/>
${appointments?.map(appointment => `<b>${appointment.humanDate}: ${appointment.slotsAvailable} slots</b>`).join('<br/>')}
<br/>
<p>Click <a href="${USER_URL}">here</a> to book a class!</p>`
    });

// 3. Send the email
const sendMail = (mailOption) => transporter.sendMail(mailOption, (error, info) => {
    if (error) {
        return console.log('Error occurred:', error);
    }
    console.log('Message sent: %s', info.messageId);
});


const bookableAppointments = [];

fetch(URL, {method: "POST", body: JSON.stringify(data)})
    .then(response => response.json())
    .then(data => {
        Object.entries(data).forEach(([date, appointments]) => {
            console.log(date, appointments);
            appointments.forEach(appointment => {
                if (appointment.slotsAvailable) {
                    bookableAppointments.push({...appointment, humanDate: date});
                }
            })
        })
        console.log(bookableAppointments);
        sendEmails(emails, bookableAppointments);
    })