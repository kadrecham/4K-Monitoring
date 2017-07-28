var http = require('http');
var ejs = require('ejs');
var fs = require('fs');
var request = require("request");
var yaml = require('js-yaml');
var url = require('url');

/* Create Server to listen to port 8000 */
http.createServer(function(req,res) {
	var path = url.parse(req.url, true);
	/* Read yaml files */
	try {		
		var ovConfig = yaml.safeLoad(fs.readFileSync('overview.yml', 'utf8'));
		if (!ovConfig){
			console.log("Can not read overview.yml");
			res.writeHead(404, {'Content-Type': 'text/html'});
			return res.end("404 Not Found");
		}
		var allTimes = {"slideTime":ovConfig[0].slideTime , "carouselTime":ovConfig[0].carouselTime};
		var ovTok = "Basic ";
		ovTok += new Buffer(ovConfig[0].username + ":" +ovConfig[0].password).toString('base64');
		var options1 = { "method": 'GET',
			"url": 'http://' + ovConfig[0].grafanaElasticIP +'/api/dashboards/db/'+ ovConfig[0].landscape,
			"headers": { "authorization": ovTok }
		};
		var config = yaml.safeLoad(fs.readFileSync('landscapes.yml', 'utf8'));
		if (!config){
			console.log("Can not read landscapes.yml");
			res.writeHead(404, {'Content-Type': 'text/html'});
			return res.end("404 Not Found");
		}
	}
	catch (e) {
		console.log(e);
		res.writeHead(404, {'Content-Type': 'text/html'});
		return res.end("404 Not Found");
	}
	var overview = {"rows":[]};
	var allLandscape = {"dashboards":[]};
	/* Make the first request to get all dashboards from overview landscape */ 
	request(options1, function (error1, response1, body1) {
		if (error1){
			console.log(error1);
			res.writeHead(404, {'Content-Type': 'text/html'});
			return res.end("404 Not Found");
		}
		else if (response1.statusCode == 200) {	
				var options = {"req":[]};
				var parsedBody1 = JSON.parse(body1);
				var flag = 0;
				var landsNo = parsedBody1.dashboard.rows.length;
				for (var i = 0; i<landsNo; i++){
					var ovPanels = {"panels":[]};
					var panelNo = parsedBody1.dashboard.rows[i].panels.length;
					flag += panelNo;
					for (var j=0; j<panelNo; j++){
						/* Create the overview panels JSON object */
						ovPanels.panels.push({"id":parsedBody1.dashboard.rows[i].panels[j].id, "title":parsedBody1.dashboard.rows[i].panels[j].title, "url":response1.request.href.replace("/api/dashboards/db/","/dashboard-solo/db/")});
						/* Get the landscape user & password */
						tok = "Basic ";
						for (one in config){
							if (url.parse(parsedBody1.dashboard.rows[i].panels[j].links[0].url, true).hostname == config[one].grafanaElasticIP)
								tok += new Buffer(config[one].username + ":" +config[one].password).toString('base64');
						}
						/* Create the option for the request for each dashboard */
						var opti = {"method": 'GET', "url": parsedBody1.dashboard.rows[i].panels[j].links[0].url.replace("/dashboard/db/","/api/dashboards/db/"), "headers": { "authorization": tok, "data": {"url":response1.request.href.replace("/api/dashboards/db/","/dashboard-solo/db/") + "?panelId=" + parsedBody1.dashboard.rows[i].panels[j].id, "id": parsedBody1.dashboard.rows[i].panels[j].id}}};
						//console.log(opti);
						/* Make the request for each dashboard */
						request(opti, function (error, response, body) {	
							if (error){
								console.log(error);
								res.writeHead(404, {'Content-Type': 'text/html'});
								return res.end("404 Not Found");
							}
							else if (response.statusCode == 200) {	
									var parsedBody = JSON.parse(body);
									/* Create the all dashboards panels JSON object */
									var rowsNo = parsedBody.dashboard.rows.length;
									var allRows = {"rows":[]};
									for(var o = 0; o<rowsNo; o++){
										var panelsNo= parsedBody.dashboard.rows[o].panels.length;
										var allPanels = {"panels":[]};
										for (var p =0; p<panelsNo; p++){
											allPanels.panels.push({"id":parsedBody.dashboard.rows[o].panels[p].id,"title": parsedBody.dashboard.rows[o].panels[p].title, "url": response.request.href.replace("/api/dashboards/db/","/dashboard-solo/db/"), "headers": response.request.headers}); 
										}
										allRows.rows.push({"title":parsedBody.dashboard.rows[o].title, "panels": allPanels.panels});
									}
									allLandscape.dashboards.push({"title": parsedBody.dashboard.title,"landscape":response.request.href.split(":3000")[0], "overviewId": response.request.headers.data.id, "overviewUrl":response.request.headers.data.url, "rows":allRows.rows });
									if (allLandscape.dashboards.length == flag){
										if (path.pathname == "/"){
											/* Read slider.html file */
											fs.readFile("./slider.html", 'utf-8', function(err, content) {
												if (err) {
													res.writeHead(404, {'Content-Type': 'text/html'});
													return res.end("404 Not Found");
												}
												/* Render slider.html file to share the JSON objects */
												res.writeHead(200, {'Content-Type': 'text/html'});
												var renderedHtml = ejs.render(content, {overview: overview, allLandscape: allLandscape, path: path.pathname, allTimes: allTimes});  
												res.end(renderedHtml);
												return res.end();
											});
										}
										else {
											/* Read index.html file */
											fs.readFile('./index.html', 'utf-8', function(err, content) {
												if (err) {
													res.writeHead(404, {'Content-Type': 'text/html'});
													return res.end("404 Not Found");
												}
												/* Render index.html file to share the JSON objects */
												res.writeHead(200, {'Content-Type': 'text/html'});
												var renderedHtml = ejs.render(content, {overview: overview, allLandscape: allLandscape, path: path.pathname, allTimes: allTimes});  
												res.end(renderedHtml);
											});
										}
									}
							}
							else {
								flag --;
								if (allLandscape.dashboards.length == flag){
										if (path.pathname == "/"){
											/* Read slider.html file */
											fs.readFile("./slider.html", 'utf-8', function(err, content) {
												if (err) {
													res.writeHead(404, {'Content-Type': 'text/html'});
													return res.end("404 Not Found");
												}
												/* Render slider.html file to share the JSON objects */
												res.writeHead(200, {'Content-Type': 'text/html'});
												var renderedHtml = ejs.render(content, {overview: overview, allLandscape: allLandscape, path: path.pathname, allTimes: allTimes});  
												res.end(renderedHtml);
												return res.end();
											});
										}
										else {
											/* Read index.html file */
											fs.readFile('./index.html', 'utf-8', function(err, content) {
												if (err) {
													res.writeHead(404, {'Content-Type': 'text/html'});
													return res.end("404 Not Found");
												}
												/* Render index.html file to share the JSON objects */
												res.writeHead(200, {'Content-Type': 'text/html'});
												var renderedHtml = ejs.render(content, {overview: overview, allLandscape: allLandscape, path: path.pathname, allTimes: allTimes});  
												res.end(renderedHtml);
											});
										}
									}
							}
						});
					}
					/* Overview panels JSON object */
					overview.rows.push({"title": parsedBody1.dashboard.rows[i].title, "landscape": response1.request.href.split(":3000")[0], "panels": ovPanels.panels});
				}
			
		}
		else {
			console.log("No Landscape-overviw dashboard found...!");
			res.writeHead(404, {'Content-Type': 'text/html'});
			return res.end("404 Not Found");
		}
    });
    
}).listen(8000);