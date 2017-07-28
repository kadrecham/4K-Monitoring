# 4K-Monitoring
## monitoring-web-app
Web application for 4k monitor

### The Aim:
Building an internal monitoring web application for the all HCP Big data team's landscapes.

### Tools:
- Node.js
- JavaScript
- Bootstrap
- HTML

### Summary:
The main component is a Node.js http server which requests the data from several Grafana dashboards and visualize this data on a 4k monitor.

### Run the Application:
- Install [Node.js](https://nodejs.org/dist/v6.11.1/node-v6.11.1.pkg)
- Install "ejs" npm package  `$ npm install ejs`
- Install "request" npm package `$ npm install request`
- Install "js-yaml" npm package `$ npm install js-yaml.bin`
- Clone the [repository](https://github.infra.hana.ondemand.com/hcpbd/monitoring-web-app.git) to local machine.
- You can change the time of slide and carousel from overview yml file (in second).
- Run the Node.js server `$ node server2.js`
- Open browser enter the address `http://localhost:8000/`
- It's running...!
