var carGame = {
	currentLevel: 0
};

carGame.levels = [];
carGame.levels[0] = [{"type":"car","x":50,"y":210,"fuel":20},
	{"type":"box","x":250, "y":270, "width":250, "height":25, "rotation":0},
	{"type":"box","x":500,"y":250,"width":65,"height":15, "rotation":-10},
	{"type":"box","x":600,"y":225,"width":80,"height":15, "rotation":-20},
	{"type":"box","x":950,"y":225,"width":80,"height":15, "rotation":20},
	{"type":"box","x":1100,"y":250,"width":100,"height":15, "rotation":0},
	{"type":"win","x":1200,"y":215,"width":15,"height":25, "rotation":0}];
carGame.levels[1] = [{"type":"car","x":50,"y":210,"fuel":20},
	{"type":"box","x":100, "y":270, "width":190, "height":15, "rotation":20},
	{"type":"box","x":380, "y":320, "width":100, "height":15, "rotation":-10},
	{"type":"box","x":666,"y":285,"width":80,"height":15, "rotation":-32},
	{"type":"box","x":950,"y":295,"width":80,"height":15, "rotation":20},
	{"type":"box","x":1100,"y":310,"width":100,"height":15, "rotation":0},
	{"type":"win","x":1200,"y":275,"width":15,"height":25, "rotation":0}];
carGame.levels[2] = [{"type":"car","x":50,"y":210,"fuel":20},
	{"type":"box","x":100, "y":270, "width":190, "height":15, "rotation":20},
	{"type":"box","x":380, "y":320, "width":100, "height":15, "rotation":-10},
	{"type":"box","x":686,"y":285,"width":80,"height":15, "rotation":-32},
	{"type":"box","x":250,"y":495,"width":80,"height":15, "rotation":40},
	{"type":"box","x":500,"y":540,"width":200,"height":15, "rotation":0},
	{"type":"win","x":220,"y":425,"width":15,"height":25, "rotation":23}];

var canvas;
var ctx;
var canvasWidth;
var canvasHeight;

window.addEventListener('DOMContentLoaded', function() {
	restartGame();

	canvas = document.getElementById('game');
	ctx = canvas.getContext('2d');
	canvasWidth = parseInt(canvas.width, 10);
	canvasHeight = parseInt(canvas.height, 10);

	document.addEventListener('keydown', function(ev) {
		var force;


		switch(ev.keyCode) {
			case 39:
			case 88: // x key to apply force towards right
				force = new b2Vec2(10000000, 0);
				ev.preventDefault();
				break;
			case 37:
			case 90: // z key to apply force towards left
				force = new b2Vec2(-10000000, 0);
				ev.preventDefault();
				break;
			case 82:
				restartGame();
				break;
		}

		if (force) {
			//loop all contact list to check if the driving wheel is on the ground
			for (var cn = carGame.world.GetContactList(); cn != null; cn = cn.GetNext()) {
				var body1 = cn.GetShape1().GetBody();
				var body2 = cn.GetShape2().GetBody();


				if ((body1 == carGame.drivingWheel && carGame.grounds.indexOf(body2) > -1) ||
					(body2 == carGame.drivingWheel && carGame.grounds.indexOf(body1) > -1))
				{
					carGame.car.ApplyForce(force, carGame.car.GetCenterPosition());
					break;
				}
			}


		}
	});

	step();

	function restartGame() {
		carGame.world = createWorld();
		carGame.grounds = [];
		var currentLevel = carGame.levels[carGame.currentLevel],
			currentObject;

		for (var i = 0; i < currentLevel.length; i++) {
			currentObject = currentLevel[i];
			switch (currentObject.type) {
				case 'box':
					carGame.grounds.push(createGround(currentObject.x, currentObject.y, currentObject.width, currentObject.height, currentObject.rotation));
					break;
				case 'win':
					carGame.gamewinWall = createGround(currentObject.x, currentObject.y, currentObject.width, currentObject.height, currentObject.rotation, true);
					break;
				case 'car':
					carGame.car = createCarAt(currentObject.x, currentObject.y);
					break;
			}
		}
	}

	function step() {
		carGame.world.Step(1.0 / 60, 1);

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		drawWorld(carGame.world, ctx);

		setTimeout(step, 10);

		//loop all contact list to check if the car hits the winning wall
		for (var cn = carGame.world.GetContactList(); cn != null; cn = cn.GetNext()) {
			var body1 = cn.GetShape1().GetBody();
			var body2 = cn.GetShape2().GetBody();
			if ((body1 == carGame.car && body2 == carGame.gamewinWall) ||
				(body2 == carGame.car && body1 == carGame.gamewinWall))
			{
				console.log("Level Passed!");
				carGame.currentLevel++;
				restartGame();
			}
		}
	}

	function createWorld() {
		// set the size of the world
		var worldAABB = new b2AABB();
		worldAABB.minVertex.Set(-4000, -4000);
		worldAABB.maxVertex.Set(4000, 4000);

		// Define the gravity
		var gravity = new b2Vec2(0, 300);

		// set to ignore sleeping object
		var doSleep = false;

		// finally create the world with the size, gravity, and sleep object parameter.
		var world = new b2World(worldAABB, gravity, doSleep);

		return world;

	}

	function createGround(x, y, width, height, rotation, winType) {

		// box shape definition
		var groundSd = new b2BoxDef();
		groundSd.extents.Set(width, height);
		groundSd.restitution = 0.4;

		if (winType) {
			groundSd.userData = document.getElementById('flag');
		}

		// body definition with the given shape we just created.
		var groundBd = new b2BodyDef();
		groundBd.AddShape(groundSd);
		groundBd.position.Set(x, y);
		groundBd.rotation = rotation * Math.PI / 180;

		var body = carGame.world.CreateBody(groundBd);


		return body;
	}

	function createWheel(world, x, y) {
		// wheel circle definition
		var ballSd = new b2CircleDef();
		ballSd.density = 1.0;
		ballSd.radius = 10;
		ballSd.restitution = 0.1;
		ballSd.friction = 4.3;
		ballSd.userData = document.getElementById('wheel');

		// body definition
		var ballBd = new b2BodyDef();
		ballBd.AddShape(ballSd);
		ballBd.position.Set(x, y);

		return world.CreateBody(ballBd);
	}

	function createCarAt(x ,y) {
		// create car body
		var boxSd = new b2BoxDef();
		boxSd.density = 1.0;
		boxSd.friction = 1.5;
		boxSd.restitution = .4;
		boxSd.extents.Set(40, 20);
		boxSd.userData = document.getElementById('car');

		var boxBd = new b2BodyDef();
		boxBd.AddShape(boxSd);
		boxBd.position.Set(x, y);
		var carBody = carGame.world.CreateBody(boxBd);

		// create wheels
		carGame.drivingWheel = createWheel(carGame.world, x - 26, y + 20);
		var wheelBody2 = createWheel(carGame.world, x + 35, y + 20);

		// create a joint to connect left wheel with the car body
		var jointDefLeft = new b2RevoluteJointDef();
		jointDefLeft.anchorPoint.Set(x - 26, y + 20);
		jointDefLeft.body1 = carBody;
		jointDefLeft.body2 = carGame.drivingWheel;

		carGame.world.CreateJoint(jointDefLeft);

		// create a joint to connect right wheel with the car body
		var jointDefRight = new b2RevoluteJointDef();
		jointDefRight.anchorPoint.Set(x + 35, y + 20);
		jointDefRight.body1 = carBody;
		jointDefRight.body2 = wheelBody2;

		carGame.world.CreateJoint(jointDefRight);

		return carBody;
	}

	function drawWorld(world, context) {
		for (var b = world.m_bodyList; b != null; b = b.m_next) {
			for (var s = b.GetShapeList(); s != null; s = s.GetNext()) {
				if (s.GetUserData() != undefined) {
					var img = s.GetUserData(),
						x = s.GetPosition().x,
						y = s.GetPosition().y,
						topLeftX = -img.width / 2,
						topLeftY = -img.height / 2;

					context.save();
					context.translate(x, y);
					context.rotate(s.GetBody().GetRotation());
					context.drawImage(img, topLeftX, topLeftY);
					context.restore();
				} else {
					drawShape(s, context);
				}

			}
		}
	}

	// drawShape function directly copy from draw_world.js in Box2dJS library
	function drawShape(shape, context) {
		context.strokeStyle = '#003300';
		context.beginPath();
		switch (shape.m_type) {
			case b2Shape.e_circleShape:
				var circle = shape;
				var pos = circle.m_position;
				var r = circle.m_radius;
				var segments = 16.0;
				var theta = 0.0;
				var dtheta = 2.0 * Math.PI / segments;

				// draw circle
				context.moveTo(pos.x + r, pos.y);
				for (var i = 0; i < segments; i++) {
					var d = new b2Vec2(r * Math.cos(theta), r * Math.sin(theta));
					var v = b2Math.AddVV(pos, d);
					context.lineTo(v.x, v.y);
					theta += dtheta;
				}
				context.lineTo(pos.x + r, pos.y);

				// draw radius
				context.moveTo(pos.x, pos.y);
				var ax = circle.m_R.col1;
				var pos2 = new b2Vec2(pos.x + r * ax.x, pos.y + r * ax.y);
				context.lineTo(pos2.x, pos2.y);
				break;

			case b2Shape.e_polyShape:
				var poly = shape;
				var tV = b2Math.AddVV(poly.m_position, b2Math.b2MulMV(poly.m_R, poly.m_vertices[0]));
				context.moveTo(tV.x, tV.y);
				for (var i = 0; i < poly.m_vertexCount; i++) {
					var v = b2Math.AddVV(poly.m_position, b2Math.b2MulMV(poly.m_R, poly.m_vertices[i]));
					context.lineTo(v.x, v.y);
				}
				context.lineTo(tV.x, tV.y);
				break;
		}

		context.stroke();
	}
});
