const express = require('express')
const helpers = require('../helpers')
const axios = require('axios')
const bcrypt = require('bcrypt')
const database = require('../config/database')
const router = express.Router()

router.get('/', (req, res) => {
    res.send("Network Analytic Rest Api , Copyright PT.SOLUSI TIGA BERSAMA")
})

router.get('/api/dashboard/status-router', async (req, res) => {
    try {
        const apiUrl = 'https://api-mikrotik.linkdemo.web.id/api'
        const url = '/router/device/status'
        const params = {
            "host" : "103.186.32.129",
            "user" : "test_api",
            "password" : "apianalytic",
            "port" : "8728"
        }

        const response = await axios.post(apiUrl+url, params)
        
        return res.status(200).json(response.data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/get-router', async (req, res) => {
    try {
        const data = await helpers.sendPostData('/router/list')
        
        return res.status(200).json(data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/add-router', async (req, res) => {
    try {
        const apiUrl = 'https://api-mikrotik.linkdemo.web.id/api'
        const url = '/router/add'
        const params = {
            "uuid" : "mrtk-000001",
            "code" : "MKS01",
            "name" : "MKS01",
            "ipaddress" : "103.186.32.129",
            "user" : "test_api",
            "pass" : "apianalytic",
            "port" : 8728,
            "status" : "Active"
        }

        const response = await axios.post(apiUrl+url, params)
        
        return res.status(200).json(response.data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/remove-router', async (req, res) => {
    try {
        const apiUrl = 'https://api-mikrotik.linkdemo.web.id/api'
        const url = '/router/remove'
        const params = {
            "uuid" : "2"
        }

        const response = await axios.post(apiUrl+url, params)
        
        return res.status(200).json(response.data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/update-router', async (req, res) => {
    try {
        const apiUrl = 'https://api-mikrotik.linkdemo.web.id/api'
        const url = '/router/update'
        const params = {
            "uuid" : "mrtk-000002",
            "code" : "MKS02",
            "name" : "MKS02",
            "ipaddress" : "103.186.32.199",
            "user" : "test_api",
            "pass" : "apianalytic",
            "port" : 8728,
            "status" : "Active"
        }

        const response = await axios.post(apiUrl+url, params)
        
        return res.status(200).json(response.data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/get-system', async (req, res) => {
    try {
        const data = await helpers.sendPostData('/router/system/resources/print', {
            "uuid" : req.query.uuid
        })

        let obj = data.massage[0]

        /* Get memory percentage usage */
        let freeMemory = obj["free-memory"]
        let totalMemory = obj["total-memory"]
        let ramUsage = (totalMemory - freeMemory) / totalMemory
        obj["ram-usage"] = (ramUsage * 100).toFixed(2)

        /* Get hdd percentage usage */
        let freeHdd = obj["free-hdd-space"]
        let totalHdd = obj["total-hdd-space"]
        let hddUsage = (totalHdd - freeHdd) / totalHdd
        obj["hdd-usage"] = (hddUsage * 100).toFixed(2)
        
        return res.status(200).json(obj)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/get-hotspot-active', async (req, res) => {
    try {
        const data = await helpers.sendPostData('/router/device/hotspot/active/print', {
            "uuid" : "mrtk-000001"
        })
        
        return res.status(200).json(data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/get-dhcp-server', async (req, res) => {
    try {
        const data = await helpers.sendPostData('/router/ip/dhcp-server/print', {
            "uuid" : req.query.uuid
        })

        return res.status(200).json(data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/get-kid-control', async (req, res) => {
    try {
        const data = await helpers.sendPostData('/router/ip/kid-controll/print', {
            "uuid" : "mrtk-000002"
        })
        
        return res.status(200).json(data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/get-interface', async (req, res) => {
    try {
        const apiUrl = 'https://api-mikrotik.linkdemo.web.id/api'
        const url = '/router/interface/list/print'
        const params = {
            "uuid" : "mrtk-000002"
        }

        const response = await axios.post(apiUrl+url, params)
        const responseData = response.data.massage

        let arrData = []

        responseData.forEach((value, index) => {
            arrData.push(value.name)
        })
        
        return res.status(200).json(arrData)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/interface-monitor-live', async (req, res) => {
    try {
        const apiUrl = 'https://api-mikrotik.linkdemo.web.id/api'
        const url = '/router/interface/list/monitor/live'
        const params = {
            "uuid" : "mrtk-000002",
            "ethernet" : [
                "ether1",
                "ether2",
                "ether3",
                "ether4",
            ]
        }

        const response = await axios.post(apiUrl+url, params)
        
        return res.status(200).json(response.data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/interface-monitor-log-add', async (req, res) => {
    try {
        const apiUrl = 'https://api-mikrotik.linkdemo.web.id/api'
        const url = '/router/interface/list/monitor/log/add'
        const params = {
            "uuid" : "mrtk-000002",
            "ethernet" : [
                "ether1",
                "ether2",
                "ether3",
                "ether4",
            ]
        }

        const response = await axios.post(apiUrl+url, params)
        
        return res.status(200).json(response.data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/interface-monitor-log-list', async (req, res) => {
    try {
        const apiUrl = 'https://api-mikrotik.linkdemo.web.id/api'
        const url = '/router/interface/list/monitor/log/list'
        const params = {
            "uuid" : "mrtk-000002",
            "ethernet" : [
                "ether1",
                "ether2",
                "ether3",
                "ether4",
            ]
        }

        const response = await axios.post(apiUrl+url, params)
        
        return res.status(200).json(response.data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/interface-monitor-log-delete', async (req, res) => {
    try {
        const apiUrl = 'https://api-mikrotik.linkdemo.web.id/api'
        const url = '/router/interface/list/monitor/log/delete'
        const params = {
            "uuid" : "mrtk-000002",
            "ethernet" : [
                "ether1",
                "ether2",
                "ether3",
                "ether4",
            ]
        }

        const response = await axios.post(apiUrl+url, params)
        
        return res.status(200).json(response.data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/interface-monitor-log-stop', async (req, res) => {
    try {
        const apiUrl = 'https://api-mikrotik.linkdemo.web.id/api'
        const url = '/router/interface/list/monitor/stop'
        const params = {
            "uuid" : "mrtk-000002",
            "ethernet" : [
                "ether1",
                "ether2",
                "ether3",
                "ether4",
            ]
        }

        const response = await axios.post(apiUrl+url, params)
        
        return res.status(200).json(response.data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/logs-print', async (req, res) => {
    try {
        const apiUrl = 'https://api-mikrotik.linkdemo.web.id/api'
        const url = '/router/logs/print'
        const params = {
            "uuid" : "mrtk-000002",
            "date" : "2023-11-29",
            "time" : "16", // nama file json atau jam capture
            "ethernet" : "ether1"
        }

        const response = await axios.post(apiUrl+url, params)
        
        return res.status(200).json(response.data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/logs-list', async (req, res) => {
    try {
        const apiUrl = 'https://api-mikrotik.linkdemo.web.id/api'
        const url = '/router/logs/list'

        const response = await axios.post(apiUrl+url)
        
        return res.status(200).json(response.data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

// router.get('/api/dashboard/logs', async (req, res) => {
//     let data = await database.query(`SELECT
//         AVG(CAST(rate_in AS numeric)) AS rate_in,
//         AVG(CAST(rate_out AS numeric)) AS rate_out,
//         created_at,
//         date
//     FROM
//         analytics
//     GROUP BY
//         created_at,date`)

//     return res.send(data.rows)    
// })

// router.get('/api/dashboard/top-traffic', async (req, res) => {
//     let data = await database.query(`SELECT
//     ethername as port,
//         SUM(tx_byte::BIGINT) AS upload,
//         SUM(rx_byte::BIGINT) AS download
//     FROM
//         interfaces
//     WHERE
//         EXTRACT(YEAR FROM TO_DATE(date, 'YYYY-MM-DD')) = EXTRACT(YEAR FROM CURRENT_DATE)
//         AND EXTRACT(MONTH FROM TO_DATE(date, 'YYYY-MM-DD')) = EXTRACT(MONTH FROM CURRENT_DATE)
//     GROUP BY
//         ethername`)

//     return res.send(data.rows)    
// })

router.get('/api/dashboard/logs-sites', async (req, res) => {
    try {
        const url = 'http://103.16.117.62/logs/page?page=1&limit=10'

        const response = await axios.get(url)
        const responseData = response.data.data

        return res.send(responseData)
    } catch (error) {
        console.error('Error fetching data:', error)
        return null
    }
})

/* User Management Module  */
router.get('/api/dashboard/list-users', async (req, res) => {
    let query = `SELECT * FROM users`
    let data = await database.query(query)

    res.send({
        message: 'Data listed successfully',
        data: data[0],
        success: true,
    })
})

router.post('/api/dashboard/create-users', async (req, res) => {
    let username = req.body.username
    let full_name = req.body.full_name
    let password = await bcrypt.hash(req.body.password, 10)
    let role_id = req.body.role_id

    let query = `INSERT INTO users (username, full_name, password, role_id) 
        VALUES ('${username}', '${full_name}', '${password}', '${role_id}')`
    let data = await database.query(query)

    res.send({
        message: 'Data saved successfully',
        data: [],
        success: true,
    })
})
router.get('/api/dashboard/edit-users/:id', async (req, res) => {
    let id = req.params.id
    let query = `SELECT * FROM users WHERE id='${id}'`
    let data = await database.query(query)

    res.send({
        message: 'Data edit successfully',
        data: data[0][0],
        success: true,
    })
})

router.post('/api/dashboard/update-users/:id', async (req, res) => {
    let id = req.params.id
    let query_find_user = `SELECT * FROM users WHERE id='${id}'`
    let data_find_user = await database.query(query_find_user)

    let username = req.body.username
    let full_name = req.body.full_name
    let password

    if (req.body.password) {
        password = await bcrypt.hash(req.body.password, 10)
    } else {
        password = data_find_user[0][0].password
    }

    let query = `UPDATE users SET username='${username}', full_name='${full_name}', password='${password}'
        WHERE id=${id}`
    let data = await database.query(query)

    res.send({
        message: 'Data update successfully',
        data: [],
        success: true,
    })
})

router.post('/api/dashboard/delete-users/:id', async (req, res) => {
    let id = req.params.id
    let query = `DELETE FROM users WHERE id=${id}`
    let data = await database.query(query)
    
    res.send({
        message: 'Data deleted successfully',
        data: [],
        success: true,
    })
})

/* Helpdesk Module  */
router.get('/api/dashboard/list-helpdesk', async (req, res) => {
    let query = `SELECT * FROM helpdesk JOIN users ON helpdesk.user_id=users.id`
    let data = await database.query(query)

    let query_count = `SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN status = '1' THEN 1 END) AS closed,
        COUNT(CASE WHEN status = '2' THEN 1 END) AS deleted,
        COUNT(CASE WHEN status = '3' THEN 1 END) AS pending
    FROM
        helpdesk`

    let data_count = await database.query(query_count)

    res.send({
        message: 'Data listed successfully',
        data: {
            data: data[0],
            total_ticket: data_count[0][0].total,
            pending_ticket: data_count[0][0].pending,
            deleted_ticket: data_count[0][0].deleted,
            closed_ticket: data_count[0][0].closed,

        },
        success: true,
    })
})

router.get('/api/dashboard/generate-helpdesk-ticket', async (req, res) => {
    let ticket = await helpers.generateTicketNumber()

    res.send({
        data: ticket
    })
})

router.post('/api/dashboard/create-helpdesk', async (req, res) => {
    let user_id = req.body.user_id || 2
    let subject = req.body.subject
    let description = req.body.description
    let due_date = req.body.due_date
    let ticket_number = req.body.ticket_number

    let query = `INSERT INTO helpdesk (user_id, description, status, due_date, code, subject) 
        VALUES (${user_id}, '${description}', '3', '${due_date}', '${ticket_number}', '${subject}')`
    let data = await database.query(query)

    res.send({
        message: 'Data saved successfully',
        data: [],
        success: true,
    })
})

router.post('/api/dashboard/update-helpdesk/:id', async (req, res) => {
    let id = req.params.id
    let description = req.body.description
    let status = req.body.status
    let notes = req.body.notes

    let query = `UPDATE helpdesk SET description='${description}', status='${status}', notes='${notes}'
        WHERE ticket_number=${id}`
    let data = await database.query(query)

    res.send({
        message: 'Data update successfully',
        data: [],
        success: true,
    })
})

router.post('/api/dashboard/delete-helpdesk', async (req, res) => {
    let code = req.body.code
    let query = `DELETE FROM helpdesk WHERE code='${code}'`
    let data = await database.query(query)
    
    res.send({
        message: 'Data deleted successfully',
        data: [],
        success: true,
    })
})

module.exports = router
