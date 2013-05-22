var dgram = require("dgram");
var server = dgram.createSocket("udp4");
var dns = require("dns");
var time_server_domain = "time.windows.com";
var time_diff = 60*18; 
var client_pool = [];
server.on("message", function(msg, rinfo) {
	var handler = function(err, time_server_ip, ipv){
		if(err){
			console.log(err);
			return
		}
		console.log(new Date());
		console.log(["  message from ",rinfo.address,":",rinfo.port].join(''));
		if(rinfo.address != time_server_ip){ //time sync request from client
			client_pool.push({address:rinfo.address,port:rinfo.port});
			server.send(msg, 0, msg.length, 123, time_server_ip, function(err, bytes) {
				if (err) throw err;
				console.log(new Date());
				console.log('  ask to sent to time.windows.com');
			});
		} else {
			var time_standard = msg.readUInt32BE(32);
			msg.writeUInt32BE( time_standard + time_diff, msg.length-16);
			msg.writeUInt32BE( time_standard + time_diff, msg.length-8);
			while(client_pool.length != 0){
				(function(to_ip, to_port){
					server.send(msg, 0, msg.length, to_port, to_ip, function(err, bytes) {
						if (err) throw err;
						console.log(new Date());
						console.log('  response to ' + to_ip +':' + to_port);
					});
				})(client_pool[0].address, client_pool[0].port);
				client_pool.splice(0, 1);
			}
		}
	}
	dns.lookup(time_server_domain, 4, handler);
});

server.on("listening", function() {
	var address = server.address();
	console.log("server listening " + address.address + ":" + address.port);
});

server.bind(123);



