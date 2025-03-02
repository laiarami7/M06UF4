const PORT=7777;

let http = require('http');
let static = require('node-static');
let ws = require('ws'); 
let file = new static.Server('./public');
 
let http_server= http.createServer(function (request, response) {
    request.addListener('end', function () {
        file.serve(request, response);
    }).resume();
}).listen(PORT);

let player1, player2;
let spectators=[];
let ws_server = new ws.Server({server: http_server});
ws_server.on('connection', function (conn){
	console.log("Usuario conectado");

	if (player1 == null) {
		player1 = conn;
		let info = { player_num: 1 };
		player1.send(JSON.stringify(info));

		player1.on('close', function () {
			console.log("Player1 disconnected");
			player1 = null;
			if (player2) {
				let winnerData = { player_disconnected: true, winner: 2 };
				player2.send(JSON.stringify(winnerData));
				sendInfoToSpectators(winnerData);
			}

		});

		player1.on('message', function (msg) {

			if (player2 == null) {
				return;
			}

			let info = JSON.parse(msg);

			if (info.y != null) {
				info.player = 1;
				player2.send(JSON.stringify(info));
				sendInfoToSpectators(info);
			}

			else if (info.by != null) {
				player2.send(JSON.stringify(info));
				sendInfoToSpectators(info);
			}

			else if (info.score1 != null) {
				player2.send(JSON.stringify(info));
				sendInfoToSpectators(info);
				if (info.score1 >= 3 || info.score2 >= 3) {
					let data = {
						game_over: true,
						winner: 0
					};

					if (info.score1 >= 3) {
						data.winner = 1;
					}
					else {
						data.winner = 2;
					}

					let data_json = JSON.stringify(data);

					player1.send(data_json);
					player2.send(data_json);
					sendInfoToSpectators(data);

					return;
				}

			}
		});
	}
	else if (player2 == null) {
		player2 = conn;
		let info = { player_num: 2 };

		player2.send(JSON.stringify(info));
		player2.on('close', function () {
			console.log("Player2 disconnected");
			player2 = null;
			if (player1) {
				let winnerData = { player_disconnected: true, winner: 1 };
				player1.send(JSON.stringify(winnerData));
				sendInfoToSpectators(winnerData);
			}
		});

		setTimeout(function () {
			let info = {
				game_start: true
			};
			let info_json = JSON.stringify(info);
			player1.send(info_json);
			player2.send(info_json);
			sendInfoToSpectators(info);

			let audioInfo = JSON.stringify({ play_audio: true, music_state: Date.now() });
			player1.send(audioInfo);
			player2.send(audioInfo);
			sendInfoToSpectators(audioInfo);

		}, 500);

		player2.on('message', function (msg) {
			if (player1 == null) {
				return;
			}
   			let info = JSON.parse(msg);
			if (info.y != null) {
				info.player = 2;
				player1.send(JSON.stringify(info));
				sendInfoToSpectators(info);
			}

		});


	}
	else {
		spectators.push(conn);
		console.log("Nuevo espectador conectado. Total: ", spectators.length);

		if (player1 && player2) {
			let gameState = { game_start: true };
			conn.send(JSON.stringify(gameState));
		}
		conn.on('close', function () {
			spectators = spectators.filter(i => i !== conn);
			console.log("Espectador desconectado. Total: ", spectators.length);
		});
	}
});

function sendInfoToSpectators(info) {
	let data_json = JSON.stringify(info);
	spectators.forEach(spectator => {
		spectator.send(data_json);
	});
}


