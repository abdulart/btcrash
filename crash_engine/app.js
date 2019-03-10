const express = require('express');


const app = express();



const server = app.listen(3001, function() {
    //console.log('server running on port 3001');
});


const monk = require('monk');
const db = monk('localhost/local');
const users = db.get('users');
const games = db.get('games');


const io = require('socket.io')(server);

io.on('connection', function(socket) {
    io.emit('tick',{current: 'Ждем...', inProcess: false});
	    socket.on('stake', function(stake) {
			handleStake(stake);
		});
		socket.on('stopGame', function(data) {
			handleExit(data);
		})
	refreshStaken();
	updateLastGames();
});

// Gaming stuff
const ticker = {current: 1.00, last: 1.01};
const gameObject = {
	players: [],
	stakeOffering: false,
};

// Alert emit
function alertError(msg) {
	io.emit('alert', msg);
}

function handleSucceedStake(obj) {
	refreshStaken();
	io.emit('succeedStake', obj);
}

function refreshStaken() {
	io.emit('ingamerefresh', gameObject.players);
}


function updateLastGames() {
	games.find({}, {limit: 20, sort: {_id: -1}})
        .then(game_collection => {
            io.emit('lastgamesupdate', game_collection);
        });
}

function handleExit(data) {
	const user_in = gameObject.players.find(x => x.email === data.email);
	if(user_in && (ticker.current < ticker.last)) {
		const winning_number = ticker.current;
		const winning_amount = Math.round(user_in.rub*winning_number * 100) /100;
		users.findOneAndUpdate({email: user_in.email}, {$inc: {rub: winning_amount}})
			.then((updatedDoc) => {
			gameObject.players = gameObject.players.filter((obj) => {
				return obj.email !== user_in.email;
			});
			console.log(gameObject.players);
			refreshStaken();
		});
	}
}

// Methods stuff
function handleStake(stake) {
	if(stake.email) {
		if(!gameObject.players.find(x => x.email === stake.email) && gameObject.stakeOffering) {
			users.findOne({email: stake.email})
				.then(user => {
					console.log(user);
					rub = user.rub;
					if(stake.stake <= rub) {
						gameObject.players.push({email: stake.email, rub: stake.stake});
						users.findOneAndUpdate({email: stake.email}, {$set: {rub: (rub - stake.stake)}})
						.then((updatedDoc) => {
							handleSucceedStake({
								email: stake.email,
								rub: (rub - stake.stake),
							});
						})
						.catch(err => {
							alertError('Не удалось сделать ставку '+err);
						})
					} else {
						alertError('Недостаточно средств');
					}
				})
				.catch(err => {
					console.log(err);
				});
			} else {
				alertError('Вы уже сделали ставку');
			}
	}
}

function getRandomBetween(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

function getTickVelocity(current) {
	if(current < 2) return 100;
	if(current >= 2 && current < 3) return 90;
	if(current >= 3 && current < 4) return 80;
	if(current >= 4 && current < 5) return 70;
	if(current >= 5 && current < 6) return 60;
	if(current >= 6 && current < 7) return 50;
	if(current >= 7 && current < 8) return 40;
	if(current >= 8 && current < 9) return 30;
	if(current >= 9) return 20;
}

function tick() {
	if(ticker.current < ticker.last) {
		io.emit('tick',{current: ticker.current.toFixed(2), inProcess: true});
		ticker.current = Math.round((ticker.current + 0.01)*100)/100;
		setTimeout(tick, getTickVelocity(ticker.current));
	} else {
		console.log('vse, crash na '+ticker.current);
		const last_to_this_game = ticker.current;
		io.emit('tick',{current: 'Обвалилось на '+ticker.current.toFixed(2), inProcess: false, failed: true});
		games.find({}, {limit: 1, sort: {_id: 1}})
        .then(game_collection => {
            games.remove({"_id": game_collection[0]._id})
            .then(() => {
				games.insert({ last : last_to_this_game})
				.then();
            });
        });
		ticker.current = 1;
		gameObject.players = [];
		refreshStaken();
		setTimeout(game,5000);
	}
}

function game() {
	io.emit('tick',{current: 'Ждем 5 секунд...', inProcess: false, crash: true, waiting: true});
	gameObject.stakeOffering = true;
	updateLastGames();
	setTimeout(function() {
		gameObject.stakeOffering = false;
		const random_value_decider = Math.round(getRandomBetween(101,200) * 100) / 10000;
		let delimiter = 200;
		if(random_value_decider > 1.7) {
			delimiter = 1000;
		}
		const random_value = Math.round(getRandomBetween(101,delimiter) * 100) / 10000;
		console.log(random_value);

		ticker.last = random_value;
		ticker.current = Math.round((ticker.current + 0.01)*100)/100;
		tick();
	}, 5000);
}

game();