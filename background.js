const express = require('express')
const http = require('http')
const axios = require('axios')
const app = express()
const fs = require('fs');
const database = require('./config/database')
const cron = require('node-cron')
const { lastDayOfMonth } = require('date-fns')

const server = http.createServer(app)
const apiUrl = 'https://api-mikrotik.linkdemo.web.id/api'
const lastDayOfTheMonth = lastDayOfMonth(new Date())

function logger(data) {
    const pathLocation = "storage";

    if (!fs.existsSync(pathLocation)) {
        fs.mkdirSync(pathLocation, { recursive: true });
        fs.writeFile("storage/schedule.log", "", () => {});
    }

    // Use 'a+' to open the file for reading and appending
    const log = fs.createWriteStream("storage/schedule.log", { flags: "a+" });

    const newLogs = `- ${new Date().toLocaleString()}:`;

    log.write(`${newLogs} ${data}\n`);
    log.end();
}

function getFormatedTime(format) {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')

    if (format == 'datetime') {
        format = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`    
    }

    if (format == 'date') {
        format = `${year}-${month}-${day}`
    }

    return format
}

async function interfaceList() {
    try {
        const url = '/router/interface/list/print'
        const params = {
            "uuid" : "mrtk-000001"
        }

        const response = await axios.post(apiUrl+url, params)
        const responseData = response.data.massage

        let arrData = []

        responseData.forEach((value, index) => {
            arrData.push(value.name)
        })

        return arrData
    } catch (error) {
        console.error('Error fetching data:', error)
        return null
    }
}

async function hitSocket() {
    try {
        const interfaces = await interfaceList()
        const url = '/router/interface/list/monitor/live'
        const params = {
            "uuid" : "mrtk-000001",
            "ethernet" : interfaces
        }

        const response = await axios.post(apiUrl+url, params)

        console.log(response.data)
    } catch (error) {
        console.error('Error fetching data:', error)
        return null
    }
}

async function getAverageData() {
    try {
        const now = new Date()
        const currentHour = now.getHours()

        let date = getFormatedTime('date')
        let datetime = getFormatedTime('datetime')

        const url = '/router/logs/print'
        const params = {
            "uuid" : "mrtk-000001",
            "date" : date,
            "time" : currentHour,
            "ethernet" : "ether1"
        }

        const response = await axios.post(apiUrl+url, params)

        const jsonString = response.data

        let newArray = jsonString.slice(1)
        let pushArr = []

        newArray.forEach((value, index) => {
            pushArr.push(value[0])
        })

        const jsonData = pushArr
        // Filter and map the 'rx-bits-per-second' values to integers
        const rxBitsPerSecondValues = jsonData.map(item => parseInt(item['rx-bits-per-second']))
        const txBitsPerSecondValues = jsonData.map(item => parseInt(item['tx-bits-per-second']))
        // Calculate the average
        const rxTotal = rxBitsPerSecondValues.reduce((acc, value) => acc + value, 0)
        const txTotal = txBitsPerSecondValues.reduce((acc, value) => acc + value, 0)

        const rxAvg = rxTotal / rxBitsPerSecondValues.length
        const txAvg = txTotal / txBitsPerSecondValues.length

        console.log(`Average 'rx-bits-per-second': ${rxAvg}`)
        console.log(`Average 'tx-bits-per-second': ${txAvg} - `+currentHour)

        const text = 'INSERT INTO analytics(rate_in, rate_out, date, created_at) VALUES($1, $2,$3, $4) RETURNING *'
        const values = [txAvg, rxAvg, date, datetime]
        await database.query(text, values)
    } catch (error) {
        console.error('Error fetching data:', error)
        return null
    } 
}

async function interfacesInsert() {
    try {
        const url = '/router/interface/list/print'
        const params = {
            "uuid" : "mrtk-000001"
        }

        const response = await axios.post(apiUrl+url, params)
        const responseData = response.data.massage

        let arrData = []
        let date = getFormatedTime('date')
        let datetime = getFormatedTime('datetime')

        responseData.forEach((value, index) => {
            let obj = value

            arrData.push({
                ethername: obj['name'],
                rx_byte: obj['rx-byte'],
                tx_byte: obj['tx-byte'],
                date: date,
                created_at: datetime
            })
        })

        arrData.forEach( async (value, index) => {
            const text = 'INSERT INTO interfaces(ethername, tx_byte, rx_byte, date, created_at) VALUES($1, $2,$3, $4, $5) RETURNING *'
            const values = [value.ethername, value.rx_byte, value.tx_byte, value.date, value.created_at]
            await database.query(text, values)
        })

        logger('Insert data successfully')
    } catch (error) {
        logger('Insert data error : '+error)
        return null
    }
}

// Schedule a task to run on every minutes
function scheduleEveryMinutes() {
    cron.schedule('* * * * *', () => {
        getAverageData()
        logger('Tugas dijalankan setiap menit : (hit / trigger websocket untuk data live chart ether interfaces)')
        hitSocket()
    })
}

// Schedule a task to run on every hours
function scheduleEveryHours() {
    cron.schedule('0 * * * *', () => {
        logger('Tugas dijalankan setiap jam : (get average data)');
        // getAverageData()
    })
}

// Schedule a task to run on every days
function scheduleEveryDays() {
    cron.schedule('0 0 * * *', async () => {
        logger('Tugas dijalankan setiap hari : (insert ke table interfaces)');
        interfacesInsert()
    });
}

// Schedule a task to run on the first date of every month
cron.schedule('0 0 1 * *', () => {
    logger('Task scheduled on the first date of the month : (get insert data interface awal bulan)')
    interfacesInsert()
})

// Define a cron job for the calculated last day of the month (at 00:00 AM).
cron.schedule(`0 0 ${lastDayOfTheMonth.getDate()} * *`, () => {
    logger('Running a task on the last day of the month : (get insert data interface akhir bulan)')
    interfacesInsert()
})

// Memulai penjadwalan tugas
scheduleEveryMinutes()
scheduleEveryHours()
scheduleEveryDays()

app.get('/', (req, res) => {
    res.send('Running lifecycle of data insert')
})

server.listen(4000, () => {
  console.log('Running lifecycle of data insert')
})
