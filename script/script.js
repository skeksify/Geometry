	var pi = Math.PI,
			phi = 2/(1 + Math.sqrt(5)),
			phiComp = 1-phi,
			geometryMaker = function (id) {
				var canvas = document.getElementById(id),
				ctx = canvas.getContext("2d"),
				textifyCoords = false,
				hexCosRatio = Math.cos(pi / 6), //
				hexSinRatio = Math.sin(pi / 6), // 0.5!
				octCosRatio = Math.cos(pi / 8), //
				octSinRatio = Math.sin(pi / 8), //
				softRound = function (num) {
					return Math.abs(num)<0.01 ? 0 : num;
				},
				diagonals = {
					inner: function (i, j, tot) {
						var end = tot - 1,
								round = (!i || !j) && i + j === end;
						return !round && Math.abs(i - j) > 1;
					},
					everyTwo: function (i, j, tot) {;
						return (Math.abs(i - j + tot) % tot) === 2;
					},
					everyN: function (N) {
						return function (i, j, tot) {;
							return (Math.abs(i - j + tot) % tot) === N;
						}
					}
				},
				hash = function(num) { return ("" + num).substr(0, 6); },
				hexVertices = {
					midToTop: function(x, y, rad) { return { x: x, y: y - rad }; },
					topToTopR: function(x, y, rad) { return { x: x + rad * hexCosRatio, y: y + rad * hexSinRatio }; },
					topRToBotR: function(x, y, rad) { return { x: x, y: y + rad }; },
					botRToBot: function(x, y, rad) { return { x: x - rad * hexCosRatio, y: y + rad * hexSinRatio }; },
					botToBotL: function(x, y, rad) { return { x: x - rad * hexCosRatio, y: y - rad * hexSinRatio }; },
					botLToTopL: function(x, y, rad) { return { x: x, y: y - rad }; }
				},
				octVertices = {
					midToTopLeft: function(x, y, rad) { return { x: x - rad * octSinRatio, y: y - rad * octCosRatio }; },
					topLToTopR: function(x, y, rad) { return { x: x + rad * octSinRatio * 2, y: y }; },
					topRToRTop: function(x, y, rad) { 
						var mid = { x: x - rad * octSinRatio, y: y + rad * octCosRatio };
						return { x: mid.x + rad * octCosRatio, y: mid.y - rad * octSinRatio }; 
					},
					rTopToRBot: function(x, y, rad) { return { x: x, y: y + rad * octSinRatio * 2 }; },
					rBotToBotR: function(x, y, rad) { 
						var mid = { x: x - rad * octCosRatio, y: y - rad * octSinRatio };
						return { x: mid.x + rad * octSinRatio, y: mid.y + rad * octCosRatio }; 
					},
					botRToBotL: function(x, y, rad) { return { x: x - rad * octSinRatio * 2, y: y }; },
					botLToLBot: function(x, y, rad) { 
						var mid = { x: x + rad * octSinRatio, y: y - rad * octCosRatio };
						return { x: mid.x - rad * octCosRatio, y: mid.y + rad * octSinRatio }; 
					},
					lBotToLTop: function(x, y, rad) { return { x: x, y: y - rad * octSinRatio * 2 }; }
				},
				penCache = {
					cache: {
						lines: {},
						circles: {},
						arches: {}
					},
					getPermission: function(x, y, rad, type, phi1, phi2) {

						return true;  // lol!!!!!

						var key = hash(x) + hash(y) + hash(rad),
							archKey = typeof(phi1) !== "undefined" ? key + hash(phi1) + hash(phi2) : "",
							result;

						if (this.cache[type][archKey || key]) {
							result = false;
						} else {
							this.cache[type][archKey || key] = true;
							result = true;
						}
						if (type === "arches" && this.cache.circles[key]) {
							result = false;
						}
						return result;
					}
				},
				boxes = [],
				clear = function () {
					ctx.clearRect(0, 0, canvas.width, canvas.height);
				}
				positivePiVal = function (angle) {
					return angle >= 0 ? angle : angle+2*pi;
				},
				strokeStyle = function (style) {
					ctx.strokeStyle = style;
				},
				addBox = function (title) {
					var boxMargin = 20,
						boxWidth = 240,
						boxHeight = 300,
						boxesPerRow = Math.floor(canvas.width / (boxWidth + boxMargin)),
						boxOffsetX = (boxes.length % boxesPerRow) * (boxMargin + boxWidth) + boxMargin,
						boxOffsetY = (boxMargin + boxHeight) * Math.floor(boxes.length / boxesPerRow) + boxMargin,
						boxMinPoint = { x: boxOffsetX + boxWidth/2, y: boxOffsetY + boxHeight/2 };

					ctx.rect(boxOffsetX, boxOffsetY, boxWidth, boxHeight);
					ctx.stroke();
					if (title) {
						ctx.textAlign = "center";
						ctx.font = "32px serif";
						ctx.strokeText(title, boxMinPoint.x, boxOffsetY + 30);
					}
					boxes.push(boxMinPoint);

					return boxMinPoint;
				},
				drawCustomSpiral = function (x, y, ratio, rotation) {
					var spiral = makeSpiral(x, y, ratio);

					if (rotation.rotate) {
						spiral = rotateSet(spiral, rotation.axisPoint, rotation.theta);
					}

					drawSpiral(spiral);
				},
				drawCustomShape = function (params) {
					var i, shape,
						isPolygon = params.type === 'polygon',
						isSpiral = params.type === 'spiral',
						iterate = params.iteration && !!params.iteration.iterate,
						limit = iterate ? params.iteration.limit : 1,
						rotate = params.rotation && !!params.rotation.rotate,
						theta = rotate ? params.rotation.theta : 0,
						radius = params.radius; // Must be local primitive!

					ctx.strokeStyle = params.color || '#fff';

					for (i=0; i<limit; i++) {
						if (isPolygon) {
							shape = makeGenericPolygon(params.x, params.y, radius, params.edges);
						} else if (isSpiral) {
							shape = makeSpiral(params.x, params.y, params.ratio);
						}

						if (rotate) {
							shape = rotateSet(shape, params.rotation.axisPoint, theta);
						}

						isPolygon && drawPolygon(shape);
						isSpiral && drawSpiral(shape);

						if (iterate) {
							isPolygon && (radius += params.iteration.radius);
							theta += params.iteration.angle;
						}
					}
					iterate && $('.ui-stack').addClass('wide');
				},
				drawSpiral = function (set) {
					dotSet(set, true, true);
				},
				dotSet = function (set, byRad, partial) {
					var i, setArr = [].concat(set);

					for(i=0; i<setArr.length; i++) {
						drawCircle(
							setArr[i].x,
							setArr[i].y,
							byRad ? setArr[i].circleR : 3,
							partial ? setArr[i].phi1 : null,
							partial ? setArr[i].phi2 : null
						);
						if (textifyCoords) {
							ctx.textAlign = "center";
							ctx.font = "13px arial";
							ctx.strokeText("(" + parseInt(setArr[i].x) + ", " + parseInt(setArr[i].y) + ")", setArr[i].x, setArr[i].y - 20);
						}
					}
				},
				getMidPoint = function(x1, y1, x2, y2) {
					var result = {
						x: (x1 + x2) / 2,
						y: (y1 + y2) / 2
					};
					return result;
				},
				markMiddleSpot = function() {
					drawLine(0, canvas.height/2, 20, canvas.height/2);
					drawLine(canvas.height - 20, canvas.height/2, canvas.height, canvas.height/2);
					drawLine(canvas.width/2, 0, canvas.width/2, 20);
					drawLine(canvas.width/2, canvas.height - 20, canvas.width/2, canvas.height);
				},
				getArch = function(index) {
					return {
						phi1: pi / 6 * ((index * 2) + 1),
						phi2: pi / 6 * (((index * 2) + 5) % 12)
					}
				},
				makePolygon = function(instructions, centerX, centerY, radius) {
					var result = [],
						key,
						currentPoint = { x: centerX, y: centerY };

					for (key in instructions) {
						currentPoint = instructions[key](currentPoint.x, currentPoint.y, radius);
						result.push({
							x: currentPoint.x,
							y: currentPoint.y
						});
					}
					return result;
				},
				makeHex = function(centerX, centerY, radius) {
					return makePolygon(hexVertices, centerX, centerY, radius);
				},
				makeOct = function(centerX, centerY, radius) {
					return makePolygon(octVertices, centerX, centerY, radius);
				},			
				drawPolygon = function(polygon) {
					var i;

					ctx.beginPath();
					ctx.moveTo(polygon[0].x, polygon[0].y);
					for (i = 1; i < polygon.length; i++) {
						ctx.lineTo(polygon[i].x, polygon[i].y);
					}
					ctx.closePath();
					ctx.stroke();
					return polygon;
				},
				makeGenericPolygon = function(c1, c2, radius, sides) {
					var i, result = [];

					result.push({ x: c1 + radius * Math.cos(0), y: c2 + radius * Math.sin(0) });

					for (var i = 1; i < sides;i += 1) {
						result.push({
							x: c1 + radius*Math.cos(2*pi * i/sides),
							y: c2 + radius*Math.sin(2*pi * i/sides)
						});
					}

					return result;
				},
				drawHex = function(centerX, centerY, radius) {
					return drawPolygon(makeHex(centerX, centerY, radius));
				},
				drawDiagonals = function(hex, rule) {
					var i, j;

					for (i = 0; i < hex.length; i++) {
						for (j = 0; j < hex.length; j++) {
							if (!rule || rule(i, j, hex.length)) {
								drawLine(hex[i].x, hex[i].y, hex[j].x, hex[j].y);
							}
						}
					}

				},
				drawOct = function (c1, c2, radius) {
					return drawPolygon(makeOct(c1, c2, radius));			
				},	
				drawLine = function(x1, y1, x2, y2) {
					ctx.beginPath();
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
					ctx.stroke();
				},
				drawCircle = function(centerX, centerY, radius, phi1, phi2) {
					if (penCache.getPermission(centerX, centerY, radius, "circles")) {
						ctx.beginPath();
						ctx.arc(centerX, centerY, radius, positivePiVal(phi1 || 0), positivePiVal(phi2 || 2*pi));
						ctx.stroke();
					}
				},
				drawTwoThirdsHexArc = function(centerX, centerY, radius, index) {
					var arch = getArch(index);

					if (penCache.getPermission(centerX, centerY, radius, "arches", arch.phi1, arch.phi2)) {
						ctx.beginPath();
						ctx.arc(centerX, centerY, radius, arch.phi1, arch.phi2);
						ctx.stroke();
					}
				},
				drawFlowerHex = function(c1, c2, radius, withHex, withCircle) {
					var myHex = (withHex ? drawHex : makeHex)(c1, c2, radius),
						i;

					if (withCircle) {
						drawCircle(c1, c2, radius);
					}
					for (i = 0; i < myHex.length; i++) {
						drawTwoThirdsHexArc(myHex[i].x, myHex[i].y, radius, i);
					}
					return myHex;
				},
				drawFlowerOct = function(c1, c2, radius, withCircle) {
					var c1 = canvas.width/2, c2 = canvas.height/2, radius = canvas.width/4,
					myOct = (1 ? drawOct : makeOct)(c1, c2, radius),
						i;

					if (withCircle) {
						drawCircle(c1, c2, radius);
					}
					for (i = 0; i < myOct.length; i++) {
						//drawTwoThirdsHexArc(myHex[i].x, myHex[i].y, radius, i);
						//drawFlowerHex(myOct[i].x, myOct[i].y, radius/2, 1);
					}
					
					drawDiagonals(myOct);
					return myOct;
				},
				drawFlowerOfLife = function() {
					var c1 = canvas.width/2, c2 = canvas.height/2, radius = canvas.width/4,
						myHex = makeHex(c1, c2, radius), i, midPoint,
						midHex = drawFlowerHex(c1, c2, radius / 2, 0, 1);

					for (i = 0; i < myHex.length; i++) {
						drawFlowerHex(myHex[i].x, myHex[i].y, radius / 2, 0, 1);

						drawFlowerHex(midHex[i].x, midHex[i].y, radius / 2);
						midPoint = getMidPoint(
								myHex[i].x,
								myHex[i].y,
								myHex[(i + 1) % myHex.length].x,
								myHex[(i + 1) % myHex.length].y);
						drawFlowerHex(midPoint.x, midPoint.y, radius / 2, 0, 1);
					}

					//drawCircle(c1, c2, radius);
					drawCircle(c1, c2, radius * 1.5);
				},
				drawMetatron = function() {
					var c1 = canvas.width/2, c2 = canvas.height/2, radius = canvas.width/3,
						myHex = drawHex(c1, c2, radius),
						i, midHex = drawHex(c1, c2, radius / 2);

					for (i = 0;i < myHex.length; i++) {
						drawCircle(myHex[i].x, myHex[i].y, radius/4);
						drawCircle(midHex[i].x, midHex[i].y, radius/4);
					}

					drawCircle(c1, c2, radius/4);
					drawDiagonals(myHex.concat(midHex));
				},
				drawSpirals = function(sectionNumber, customRatio) {
					var i, spiral = makeSpiral(customRatio),
						midPoint = spiral[spiral.length-1], newSet,
						thetaOffset = 2*pi / sectionNumber;

					drawSpiral(spiral);

					for (i = 1; i < sectionNumber; i++) {
						newSet = rotateSet(spiral, midPoint, thetaOffset*i);
						drawSpiral(newSet);
					}

					markMiddleSpot();
				},
				makeSpiral = function(c1, c2, customPhi) {
					var i, newRad, radius = 500,
						phi1 = pi/2, phi2 = pi,
						result = [{
							x: c1,
							y: c2,
							circleR: radius,
							phi1: phi1,
							phi2: phi2
						}], rotation = [0, 1, 0, -1],
						myPhi = customPhi || phi,
						strength = 20;

					if (customPhi > 0.75) {
						strength = 60;
						if (customPhi > 0.9) {
							strength = 160;
							if (customPhi > 0.95) {  //             Rewrite elegantly!
								strength = 460;
								if (customPhi > 0.98) {
									strength = 1100;
									if (customPhi > 0.997) {
										strength = 4600;
									}
								}
							}
						}
					} console.log("Iteration Stength", strength);
					// < 0.75: 23, <0.9: 60, <0.97:160....???????


					for (i=0; i<strength; i++) {
						newRad = radius*(1 - myPhi);

						c1 = c1 + newRad*rotation[i%4];
						c2 = c2 + newRad*rotation[(i+1)%4];
						phi1 = (phi1 - (pi/2) + (2*pi)) % (2*pi);
						phi2 = (phi2 - (pi/2) + (2*pi)) % (2*pi);

						result.push({
							x: c1,
							y: c2,
							circleR: radius*myPhi,
							phi1: phi1,
							phi2: phi2
						});

						radius *= myPhi;
					}

					//dotSet(result);
					return result;
				},
				drawTiledHex = function(full) {
					var c1 = canvas.width/2, c2 = canvas.height/2, radius = canvas.width/4,
						myHex = drawHex(c1, c2, radius),
						i, j, midMidHex, x1, y1;

					for (i = 0; i < myHex.length; i++) {
						x1 = myHex[i].x;
						y1 = myHex[i].y;
						midMidHex = drawFlowerHex(x1, y1, radius / 2, full);
						for (j = 0; j < midMidHex.length; j++) {
							drawFlowerHex(midMidHex[j].x, midMidHex[j].y, radius / 2, full);
						}
					}
					drawDiagonals(myHex);
					drawFlowerHex(c1, c2, radius / 2, full);
					drawDiagonals(drawHex(c1, c2, radius * 2))
				},
				rotateSet = function (set, axisPoint, thetaOffset) {
					var pointPolar, roundedTheta, madeAxisPoint, setEnd = set[set.length-1];
					if (axisPoint.x === null || axisPoint.y === null) { // If either is set to null, meaning a spiral rotating around his midpoint (unknown before drawn)
						madeAxisPoint = {
							x: setEnd.x,
							y: setEnd.y
						}
					}
					return set.map(function (point) {
						roundedTheta = softRound(thetaOffset);
						pointPolar = cartesianToPolar(point, madeAxisPoint || axisPoint);

						pointPolar.theta -= roundedTheta;
						pointPolar.phi1 -= roundedTheta;
						pointPolar.phi2 -= roundedTheta;

						return polarToCartesian(pointPolar, madeAxisPoint || axisPoint);
					})
				},
				getSpiralCenter = function (params) {
					var set = makeSpiral(params.x, params.y, params.ratio);

					return {
						x: set[set.length-1].x,
						y: set[set.length-1].y
					}
				},
				cartesianToPolar = function (point, relativeTo) {
					var toDeg = 180/pi,
						xDif = point.x - relativeTo.x,
						yDif = point.y - relativeTo.y,
						xNeg = xDif<0, yNeg = yDif<0,
						r = Math.sqrt(Math.pow(xDif, 2) + Math.pow(yDif, 2)),
						theta = xNeg ? Math.asin(yDif/r) : Math.acos(xDif/r),
						fullTheta = xNeg ? pi - theta : yNeg ? 2*pi - theta : theta;

//					drawCircle(relativeTo.x, relativeTo.y, Math.abs(r), fullTheta);
//					dotSet([point, relativeTo, {}]);
//					drawLine(point.x, point.y, relativeTo.x, relativeTo.y)

					return {
						r: r,
						theta: fullTheta || 0,
						circleR: point.circleR,
						phi1: point.phi1,
						phi2: point.phi2
					}
				},
				polarToCartesian = function (point, relativeTo) {
					var result = {
						x: relativeTo.x + point.r*Math.cos(point.theta),
						y: relativeTo.y + point.r*Math.sin(point.theta),
						circleR: point.circleR,
						phi1: point.phi1,
						phi2: point.phi2
					}
					return result;
				},
				this.drawTiledHex = drawTiledHex;
				this.drawMetatron = drawMetatron;
				this.drawFlowerOfLife = drawFlowerOfLife;
				this.drawCrossedOct = drawFlowerOct;

				this.shape = drawCustomShape;
				this.clear = clear;
				this.markers = markMiddleSpot;
				this.getSpiralCenter = getSpiralCenter;

			},
			ui = function (canvas) {
				var regi = {
						onlyNumbers: /^\d+$/,
						onlyNumbersNeg: /^-?\d+$/,
						onlyNumbersWithFractions: /^\d+(\.\d+)?$/,
						onlyNumbersWithFractionsNeg: /^-?\d+(\.\d+)?$/,
						hexadecimalColor: /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/
					},
					shapeStack = [],
					animationShapeStack = [],
					intervals = [],
					exportShapeStack = [],
					lsStack = localStorage.getItem('stack'),
					$canvas = $('#canvas0'),
					$controls = $('#ui-controls-wrapper'),
					$controls_inputs = $controls.find('input[type=text]'),
					$stack = $('#ui-stack-wrapper'),
					$stack_empty = $stack.find('.ui-stack-empty'),
					$stack_startAnimations = $stack.find('.ui-stack-startAnimations'),
					$stack_stopAnimations = $stack.find('.ui-stack-stopAnimations'),
					$stack_block_controls = $stack.find('.ui-stack-block-controls'),
					$stack_block_controls_saveToLS = $stack_block_controls.find('.ui-stack-saveToLS'),
					$stack_block_wrapper = $stack.find('.ui-stack-block-wrapper'),
					$stack_block = $stack_block_wrapper.find('.ui-stack-block').remove(),
					$stack_clearStack = $stack.find('.tools-clearStack'),
					$stack_exportWrapper = $stack.find('.export-wrapper'),
					$stack_modal = $stack.find('.ui-stack-modal'),
					$stack_exportOutputInput = $stack_exportWrapper.find('textarea'),
					$step1_tools = $controls.find('.tools-wrapper'),
					$step1_tools_iterator = $step1_tools.find('.iteration-wrapper'),
					$step1_tools_iterator_section = $step1_tools_iterator.find('.iterator-section'),
					$step1_tools_iterator_switchCheckbox = $step1_tools_iterator.find('#iterator-checkbox'),
					$step1_tools_iterator_inputs = $step1_tools_iterator.find('input[type=text]'),
					$step1_tools_iterator_limitInput = $step1_tools_iterator_inputs.filter('.iterator-limit'),
					$step1_tools_iterator_angleInput = $step1_tools_iterator_inputs.filter('.iterator-angle'),
					$step1_tools_iterator_radiusInput = $step1_tools_iterator_inputs.filter('.iterator-radius'),
					$step1_tools_iterator_degMode = $step1_tools_iterator.find('#iterator-angle-degreeMode'),
					$step1_tools_animator = $step1_tools.find('.animation-wrapper'),
					$step1_tools_animator_section = $step1_tools_animator.find('.animator-section'),
					$step1_tools_animator_switchCheckbox = $step1_tools_animator.find('#animator-checkbox'),
					$step1_tools_animator_inputs = $step1_tools_animator.find('input[type=text]'),
					$step1_tools_animator_intervalInput = $step1_tools_animator_inputs.filter('.animator-interval'),
					$step1_tools_animator_angleInput = $step1_tools_animator_inputs.filter('.animator-angle'),
					$step1_tools_animator_radiusInput = $step1_tools_animator_inputs.filter('.animator-radius'),
					$step1_tools_animator_degMode = $step1_tools_animator.find('#animator-angle-degreeMode'),
					$step1_tools_pushToStack = $step1_tools.find('.tools-pushToStack'),
					$step1_tools_markersSwitch = $step1_tools.find('#tools-markers'),
					$step1_tools_rotator_switchCheckbox = $step1_tools.find('#tools-rotator-checkbox'),
					$step1_tools_rotator_section = $step1_tools.find('.tools-rotator-angle, .rotation-axis-wrapper'),
					$step1_tools_rotator_angleInput = $step1_tools.find('.rotator-angle'),
					$step1_tools_rotator_angleModeCheckbox = $step1_tools.find('#rotator-angle-degreeMode'),
					$step1_tools_rotator_axisRadios = $step1_tools.find('.tools-rotator-mode-radios'),
					$step1_tools_rotator_axisCMidpointRadio = $step1_tools_rotator_axisRadios.filter('#tools-rotator-axisCMid'),
					$step1_tools_rotator_axisSMidpointRadio = $step1_tools_rotator_axisRadios.filter('#tools-rotator-axisSMid'),
					$step1_tools_rotator_axisCustomRadio = $step1_tools_rotator_axisRadios.filter('#tools-rotator-axisCustom'),
					$step1_tools_rotator_axisCustomInputs = $step1_tools.find('.tools-rotator-customAxisInput'),
					$step1_tools_rotator_axisCustomXInput = $step1_tools_rotator_axisCustomInputs.filter('.tools-rotator-customAxisInputX'),
					$step1_tools_rotator_axisCustomYInput = $step1_tools_rotator_axisCustomInputs.filter('.tools-rotator-customAxisInputY'),
					$step1_coords = $controls.find('.coords-wrapper .coords-X, .coords-wrapper .coords-Y'),
					$step1_center_wrapper = $controls.find('.step1-center-wrapper'),
					$step1_coordsX = $step1_coords.filter('.coords-X'),
					$step1_coordsY = $step1_coords.filter('.coords-Y'),
					$step1_color_wrapper = $controls.find('.color-wrapper'),
					$step1_colorInput = $step1_color_wrapper.find('input'),
					$step1_color_map_wrapper = $step1_color_wrapper.find('.color-map-wrapper'),
					$step1_radios = $controls.find("input[type=radio][name=step1-radio]"),
					$step1_radiosPolygon = $step1_radios.filter('#step1-radio1'),
					$step1_radiosSpiral = $step1_radios.filter('#step1-radio2'),
					$step2 = $controls.find('.step2'),
					$step2_sections = $step2.find('.step2-section'),
					$step2_polygon_inputs = $step2.find('.step2-polygon input'),
					$step2_polygon_edges = $step2_polygon_inputs.filter('.polygon-edges'),
					$step2_polygon_radius = $step2_polygon_inputs.filter('.polygon-radius'),
					$step2_spiral_ratio_wrapper = $step2.find('.spiral-ratio-wrapper'),
					$step2_spiral_radios = $step2_spiral_ratio_wrapper.find('input[type=radio][name=spiral-ratio-radio1]'),
					$step2_spiral_radiosGolden = $step2_spiral_radios.filter('#spiral-ratio-radio1'),
					$step2_spiral_radiosCustom = $step2_spiral_radios.filter('#spiral-ratio-radio2'),
					$step2_spiral_ratioCustom = $step2_spiral_ratio_wrapper.find('.spiral-ratio-custom'),
					polygonNames = ['Nullagon', 'Monogon', 'Digon', 'Triangle', 'Quadrilateral', 'Pentagon', 'Hexagon', 'Heptagon', 'Octagon', 'Nonagon', 'Decagon', 'Hendecagon', 'Dodecagon'],
					ranges = {
						x: [0, 1000],
						y: [0, 1000],
						edges: [3, 100],
						radius: [1, 1000],
						ratio: [0.001, 0.9999],
						rotationAngle: [0, 1000*2*pi],
						iterationAngle: [-1000*2*pi, 1000*2*pi],
						iterationRadius: [-1000, 1000],
						iterationLimit: [1, 1000]
					},
					isValid = {
						polygon: function () {
							var isValid = $step1_radiosPolygon.is(':checked'),
								edges = $step2_polygon_edges.val(),
								radius = $step2_polygon_radius.val();

							if (!edges.match(regi.onlyNumbers) || +edges < ranges.edges[0] || +edges > ranges.edges[1]) {
								isValid = false;
								+edges && $step2_polygon_edges.addClass('bad');
							} else {
								$step2_polygon_edges.removeClass('bad');
							}
							if (!radius.match(regi.onlyNumbersWithFractions) || +radius < ranges.radius[0] || +radius > ranges.radius[1]) {
								isValid = false;
								+radius && $step2_polygon_radius.addClass('bad');
							} else {
								$step2_polygon_radius.removeClass('bad');
							}

							return isValid;
						},
						spiral: function () {
							var isValid = $step1_radiosSpiral.is(':checked'),
								customRatio = $step2_spiral_ratioCustom.val();

							if (isValid) {
								if ($step2_spiral_radiosCustom.is(':checked')) { // Second
									if (!customRatio.match(regi.onlyNumbersWithFractions) || +customRatio < ranges.ratio[0] || +customRatio > ranges.ratio[1]) {
										isValid = false;
										+customRatio && $step2_spiral_ratioCustom.addClass('bad');
									} else {
										+customRatio && $step2_spiral_ratioCustom.removeClass('bad');
									}
								} else if (!$step2_spiral_radiosGolden.is(':checked')) { // Neither
									isValid = false;
								}
							}
							return isValid;
						},
						coords: function () {
							var isValid = true, x = $step1_coordsX.val(), y = $step1_coordsY.val();

							if (!x.match(regi.onlyNumbersWithFractions) || +x < ranges.x[0] || +x > ranges.x[1]) {
								isValid = false;
								x && $step1_coordsX.addClass('bad');
							} else {
								$step1_coordsX.removeClass('bad');
							}
							if (!y.match(regi.onlyNumbersWithFractions) || +y < ranges.y[0] || +y > ranges.y[1]) {
								isValid = false;
								y && $step1_coordsY.addClass('bad');
							} else {
								$step1_coordsY.removeClass('bad');
							}

							return isValid;
						},
						color: function () {
							var color = $step1_colorInput.val(),
								isValid = true;

							if (!color.match(regi.hexadecimalColor)) {
								isValid = false;
								color && $step1_colorInput.addClass('bad');
							} else {
								$step1_colorInput.removeClass('bad');
							}
							
							return isValid;
						},
						rotate: function () {
							var isValid = $step1_tools_rotator_switchCheckbox.is(':checked'),
								angle = $step1_tools_rotator_angleInput.val(),
								x = $step1_tools_rotator_axisCustomXInput.val(),
								y = $step1_tools_rotator_axisCustomYInput.val();

							if (isValid) {
								if (!angle.match(regi.onlyNumbersWithFractions) || +angle < ranges.rotationAngle[0] || +angle > ranges.rotationAngle[1]) {
									isValid = false;
									+angle && $step1_tools_rotator_angleInput.addClass('bad');
								} else {
									$step1_tools_rotator_angleInput.removeClass('bad');
								}

								if ($step1_tools_rotator_axisCustomRadio.is(':checked')) {
								if (!x.match(regi.onlyNumbers) || +x < ranges.x[0] || +x > ranges.x[1]) {
									isValid = false;
									+x && $step1_tools_rotator_axisCustomXInput.addClass('bad');
								} else {
									$step1_tools_rotator_axisCustomXInput.removeClass('bad');
								}

								if (!y.match(regi.onlyNumbers) || +y < ranges.y[0] || +y > ranges.y[1]) {
									isValid = false;
									+y && $step1_tools_rotator_axisCustomYInput.addClass('bad');
								} else {
									$step1_tools_rotator_axisCustomYInput.removeClass('bad');
								}
							}
							}
							return isValid;
						},
						iterate: function () {
							var isValid = $step1_tools_iterator_switchCheckbox.is(':checked'),
									limit = $step1_tools_iterator_limitInput.val(),
									angle = $step1_tools_iterator_angleInput.val(),
									radius = $step1_tools_iterator_radiusInput.val();

							if (isValid) {
								if (!limit.match(regi.onlyNumbers) || +limit < ranges.iterationLimit[0] || +limit > ranges.iterationLimit[1]) {
									isValid = false;
									limit && $step1_tools_iterator_limitInput.addClass('bad');
								} else {
									$step1_tools_iterator_limitInput.removeClass('bad');
								}

								if (!angle.match(regi.onlyNumbersWithFractionsNeg) || +angle < ranges.iterationAngle[0] || +angle > ranges.iterationAngle[1]) {
									isValid = false;
									angle && $step1_tools_iterator_angleInput.addClass('bad');
								} else {
									$step1_tools_iterator_angleInput.removeClass('bad');
								}

								if (!radius.match(regi.onlyNumbersWithFractionsNeg) || +radius < ranges.iterationRadius[0] || +radius > ranges.iterationRadius[1]) {
									isValid = false;
									radius && $step1_tools_iterator_radiusInput.addClass('bad');
								} else {
									$step1_tools_iterator_radiusInput.removeClass('bad');
								}
							}
							return isValid;
						},
						animate: function () {
							var isValid = $step1_tools_animator_switchCheckbox.is(':checked'),
								interval = $step1_tools_animator_intervalInput.val(),
								angle = $step1_tools_animator_angleInput.val(),
								radius = $step1_tools_animator_radiusInput.val();

							if (isValid) {
								if (!interval.match(regi.onlyNumbers) || +interval < ranges.iterationLimit[0] || +interval > ranges.iterationLimit[1]) {
									isValid = false;
									interval && $step1_tools_animator_intervalInput.addClass('bad');
								} else {
									$step1_tools_animator_intervalInput.removeClass('bad');
								}

								if (!angle.match(regi.onlyNumbersWithFractionsNeg) || +angle < ranges.iterationAngle[0] || +angle > ranges.iterationAngle[1]) {
									isValid = false;
									angle && $step1_tools_animator_angleInput.addClass('bad');
								} else {
									$step1_tools_animator_angleInput.removeClass('bad');
								}

								if (!radius.match(regi.onlyNumbersWithFractionsNeg) || +radius < ranges.iterationRadius[0] || +radius > ranges.iterationRadius[1]) {
									isValid = false;
									radius && $step1_tools_animator_radiusInput.addClass('bad');
								} else {
									$step1_tools_animator_radiusInput.removeClass('bad');
								}
							}
							return isValid;
						}
					},
					animationIsOn = false,
					getAxisPoint = function (shapeMidpointX, shapeMidpointY) {
						var result;

						if ($step1_tools_rotator_axisCustomRadio.is(':checked')) {
							result = {
								x: +$step1_tools_rotator_axisCustomXInput.val(),
								y: +$step1_tools_rotator_axisCustomYInput.val()
							}
						} else if ($step1_tools_rotator_axisCMidpointRadio.is(':checked')) {
							result = {
								x: $canvas.width()/2,
								y: $canvas.height()/2
							}
						} else if ($step1_tools_rotator_axisSMidpointRadio.is(':checked')) {
							result = {
								x: shapeMidpointX || null,
								y: shapeMidpointY || null
							}
						}

						return result;
					},
					upDown = function (e, range, customIncrement) {
						var inc = customIncrement || 1,
							min = range[0], max = range[1];
						// UP and DOWN arrows
						switch (e.keyCode) {
							case 38:
								if (this.value.match(regi.onlyNumbersWithFractionsNeg) && (+this.value + inc) <= max) {
									this.value = round.light(+this.value + inc);
								}

								if ((+this.value + inc) > max) { // Up above Max (Will only fire if previous didn't)
									this.value = max;
								}
								break;
							case 40:
								if (this.value.match(regi.onlyNumbersWithFractionsNeg) && (+this.value - inc) >= min) {
									this.value = round.light(+this.value - inc);
								}
								if ((+this.value - inc) < min) { // Down below Min
									this.value = min;
								}
								break;
						}
					},
					makeBlock = function (shapeIndex) {
						var content, result,
							shapeObj = exportShapeStack[shapeIndex];

						if (shapeObj.type === 'polygon') {
							content = polygonNames[shapeObj.edges] || 'Polygon';
						} else if (shapeObj.type === 'spiral') {
							content = 'Spiral';
						}

						result = $stack_block.clone()._show();
						result
							.append($('<button/>')
								.addClass('stack-inspect')
								.text(content)
								.css('border-color', shapeObj.color || '#FFF')
								.click(makeInspectShape(shapeIndex))
							)


						return result;
					},
					makeInspectShape = function (shapeIndex) {
						return function (e) {
							var os = $(this).offset(),
								shapeObj = exportShapeStack[shapeIndex],
								type, ob, str;

							if (shapeObj.type === 'polygon') {
								type = (polygonNames[shapeObj.edges] || 'Polygon') + ' (' + shapeObj.edges + ')';
								$stack_modal.find('.modal-radius')._show().text('Radius: ' + shapeObj.radius);
							} else if (shapeObj.type === 'spiral') {
								type = 'Spiral';
								$stack_modal.find('.modal-ratio')._show().text('Ratio: ' + (shapeObj.ratio || 'Golden'));
							}

							$stack_modal.find('.modal').text(shapeObj);

							if (shapeObj.rotation && shapeObj.rotation.rotate) {
								ob = $stack_modal.find('.modal-rotation-wrapper')._show();
								ob.find('.modal-rotation-angle').text(round.any(shapeObj.rotation.theta, 5));
								str = shapeObj.rotation.axisPoint.x === null || shapeObj.rotation.axisPoint.y === null ? 'MidPoint' : ('(' + shapeObj.rotation.axisPoint.x + ', ' + shapeObj.rotation.axisPoint.y + ')');
								ob.find('.modal-rotation-axis').text(str);
							} else {
								$stack_modal.find('.modal-rotation-wrapper')._hide();
							}

							if (shapeObj.iteration && shapeObj.iteration.iterate) {
								ob = $stack_modal.find('.modal-iteration-wrapper')._show();
								ob.find('.modal-iteration-limit').text(shapeObj.iteration.limit);
								ob.find('.modal-iteration-radius').text(shapeObj.iteration.radius);
								ob.find('.modal-iteration-angle').text(shapeObj.iteration.angle);
							} else {
								$stack_modal.find('.modal-iteration-wrapper')._hide();
							}

							if (shapeObj.animation && shapeObj.animation.animate) {
								ob = $stack_modal.find('.modal-animation-wrapper')._show();
								ob.find('.modal-animation-interval').text(shapeObj.animation.interval);
								ob.find('.modal-animation-radius').text(shapeObj.animation.radius);
								ob.find('.modal-animation-angle').text(shapeObj.animation.angle);
							} else {
								$stack_modal.find('.modal-animation-wrapper')._hide();
							}

							$stack_modal.find('.modal-type').text(type);
							$stack_modal.find('.modal-coords').text('Center: (' + shapeObj.x + ', ' + shapeObj.y + ')');

							$stack_modal._show().css({
								'top': os.top,
								'left': e.offsetX,
								'border-color': shapeObj.color || '#FFF'
							});

							$stack_modal.find('.stack-delete').attr('data-shape-index', shapeIndex);
							$stack_modal.find('.stack-load-params').attr('data-shape-index', shapeIndex);
						}
					},
					deleteFromStack = function (e) {
						var i = $(e.target).attr('data-shape-index');
						shapeStack.splice(i, 1);
						exportShapeStack.splice(i, 1);
						stopAnimation(true);
						updateStackIndication();
						drawStack();
						generateShape();
						toggleAnimationView();
						$stack_block_controls_saveToLS.text('Save to LocalStorage *');
						$stack_modal._hide();
					},
					loadParamsFromStack = function (e) {
						var i = $(e.target).attr('data-shape-index'),
							shapeObj = exportShapeStack[i];

						$step1_radios.filter('[value="' + shapeObj.type + '"]').prop('checked', true);
						$step1_coordsX.val(shapeObj.x);
						$step1_coordsY.val(shapeObj.y);
						$step1_colorInput.val(shapeObj.color || '#FFF');

						if (shapeObj.type === 'polygon') {
							$step1_radios
							$step2_polygon_edges.val(shapeObj.edges);
							$step2_polygon_radius.val(shapeObj.radius);
						} else if (shapeObj.type === 'spiral') {
							if (shapeObj.ratio) {
								$step2_spiral_radiosCustom.prop('checked', true);
								$step2_spiral_ratioCustom.val(shapeObj.ratio);
							} else {
								$step2_spiral_radiosGolden.prop('checked', true);
							}
						}

						if (shapeObj.rotation.rotate) {
							$step1_tools_rotator_switchCheckbox.prop('checked', true);
							$step1_tools_rotator_angleInput.val(shapeObj.rotation.theta);
							if (shapeObj.rotation.axisPoint.x && shapeObj.rotation.axisPoint.y) {
								$step1_tools_rotator_axisCustomRadio.prop('checked', true);
								$step1_tools_rotator_axisCustomXInput.val(shapeObj.rotation.axisPoint.x);
								$step1_tools_rotator_axisCustomYInput.val(shapeObj.rotation.axisPoint.y);
							} else {
								$step1_tools_rotator_axisSMidpointRadio.prop('checked', true);
							}
						}

						if (shapeObj.iteration.iterate) {
							$step1_tools_iterator_switchCheckbox.prop('checked', true);
							$step1_tools_iterator_limitInput.val(shapeObj.iteration.limit);
							$step1_tools_iterator_angleInput.val(shapeObj.iteration.angle);
							$step1_tools_iterator_radiusInput.val(shapeObj.iteration.radius);
						}

						if (shapeObj.animation.animate) {
							$step1_tools_animator_switchCheckbox.prop('checked', true);
							$step1_tools_animator_intervalInput.val(shapeObj.animation.interval);
							$step1_tools_animator_angleInput.val(shapeObj.animation.angle);
							$step1_tools_animator_radiusInput.val(shapeObj.animation.radius);
						}

						generateShape();
						toggleTypeView();
						toggleRotationView();
						toggleIterationView();
						toggleAnimationView();

					},
					drawStack = function (recursive) {
						canvas.clear();
						for (var i=0; i<shapeStack.length; i++) {
							shapeStack[i]();
						}
						if ($step1_tools_markersSwitch.is(':checked')) {
							canvas.markers();
						}
						if (recursive) {
							intervals[-1] = requestAnimationFrame(drawStack);
						}
					},
					updateStackIndication = function () {
						var index;

						$step1_tools_pushToStack.val('Save to Stack (' + exportShapeStack.length + ')');

						if (!exportShapeStack.length) {
							$stack_empty._show();
							$stack_block_wrapper._hide();
						} else {
							$stack_empty._hide();
							$stack_block_wrapper.html('');
							for (index=0; index<exportShapeStack.length; index++) {
								$stack_block_wrapper.append(makeBlock(index));
							}
							$stack_block_wrapper._show();
							$stack_block_controls._show();
						}
					},
					getShapeParams = function () {
						var x, y, iterationParams = {}, rotationParams = {}, animationParams = {},
							degreesModifierRotate = $step1_tools_rotator_angleModeCheckbox.is(':checked') ? pi/180 : 1,
							degreesModifierIterate = $step1_tools_iterator_degMode.is(':checked') ? pi/180 : 1,
							degreesModifierAnimate = $step1_tools_animator_degMode.is(':checked') ? pi/180 : 1,
							color = isValid.color() ? $step1_colorInput.val() : '',
							type = $step1_radios.filter(':checked').val(),
							result;

						x = +$step1_coordsX.val();
						y = +$step1_coordsY.val();

						if (isValid.rotate()) { // Rotate!
							rotationParams = {
								rotate: true,
								theta: +$step1_tools_rotator_angleInput.val() * degreesModifierRotate,
								axisPoint: getAxisPoint(x, y)
							}
						}

						if (isValid.iterate()) { // Iterate!
							iterationParams = {
								iterate: true,
								limit: +$step1_tools_iterator_limitInput.val(),
								angle: +$step1_tools_iterator_angleInput.val() * degreesModifierIterate,
								radius: +$step1_tools_iterator_radiusInput.val()
							}
						}

						if (isValid.animate()) { // Animate!
							animationParams = {
								animate: true,
								interval: +$step1_tools_animator_intervalInput.val(),
								angle: +$step1_tools_animator_angleInput.val() * degreesModifierAnimate,
								radius: +$step1_tools_animator_radiusInput.val()
							}
						}

						result = {
							type: type,
							x: x, y: y,
							rotation: rotationParams,
							iteration: iterationParams,
							animation: animationParams,
							color: color
						};

						if (type === 'polygon') {
							result = jQuery.extend(true, result, {
								edges: +$step2_polygon_edges.val(),
								radius: +$step2_polygon_radius.val()
							})
						} else if (type === 'spiral') {
							if ($step2_spiral_radiosCustom.is(':checked')) {
								result.ratio = +$step2_spiral_ratioCustom.val()
							}
							if (result.rotation.rotate) {
								result.rotation.axisPoint = getAxisPoint(null);
							}
						}

						return result;
					},
					generateShape = function (e, store) {
						setTimeout(function () { // To catch first value
							var params;
							if (isValid.coords()) {
								params = getShapeParams();
								if (params.type && isValid[params.type]()) {
									if (store) {
										shapeStack.push(canvas.shape.bind(canvas.shape, params));
										exportShapeStack.push(params);
										saveCurrentStackToLocalStorage();
										updateStackIndication();
										startStackAnimations();
									} else {
										stopAnimation(true);
										drawStack();
										toggleAnimationView();
										canvas.shape(params);
									}
								}
							}
						}, 10)
					},
					saveShapeToStack = generateShape.bind(null, null, true),
					round = {
						light: function (num) {
							var result = ("" + num).substr(0, 6);
							return +result;
						},
						two: function (num) {
							return this.any(num, 2);
						},
						any: function (num, precision) {
							var m = Math.pow(10, precision);
							return Math.round(num * m) / m;
						}
					},
					makeShapeMakingFunction = function (shape) {
						return canvas.shape.bind(canvas, shape);
					},
					exportStackFunctionification = function (single, fromAnimation) {
						if (!$.isUn(single)) {
							shapeStack[single] = makeShapeMakingFunction((fromAnimation ? animationShapeStack : exportShapeStack)[single]);
						} else {
							shapeStack = exportShapeStack.map(makeShapeMakingFunction)
						}
					},
					makeUpDownFunction = function (range, customInc) {
						return function (e) {
							upDown.call(e.target, e, range, customInc);
						}
					},
					saveCurrentStackToLocalStorage = function () {
						localStorage.setItem('stack', JSON.stringify(exportShapeStack));
						$stack_block_controls_saveToLS.text('Save to LocalStorage');
					},
					importStack = function (stack) {
						exportShapeStack = JSON.parse(stack);
						exportStackFunctionification();
						updateStackIndication();
						drawStack();
					},
					startStackAnimations = function () {
						var i, animation, hasAny = false;

						animationIsOn = true;
						animationShapeStack = jQuery.extend(true, {}, { a: exportShapeStack}).a;

						for (i=0; i<exportShapeStack.length; i++) {
							animation = exportShapeStack[i].animation;
							if (animation && animation.animate) {
								hasAny = true;
								intervals.push(
									setInterval((function (i) {
										var shape = animationShapeStack[i],
											animation = exportShapeStack[i].animation;
										return function () {
											shape.radius += animation.radius;
											if (shape.rotation.rotate) {
												shape.rotation.theta += animation.angle;
											}
											exportStackFunctionification(i, true);
										}
									})(i), animation.interval)
								)
							}
						}
						if (hasAny) {
							drawStack(true);
						} else {
							alert('No animations')
						}
					},
					toggleTypeView = function () {
						$step2_sections.filter('.step2-polygon')._toggle($step1_radiosPolygon.is(':checked'));
						$step2_sections.filter('.step2-spiral')._toggle($step1_radiosSpiral.is(':checked'));
					},
					toggleRotationView = function () {
						$step1_tools_rotator_section._toggle($step1_tools_rotator_switchCheckbox.is(':checked'));
					},
					toggleIterationView = function () {
						$step1_tools_iterator_section._toggle($step1_tools_iterator_switchCheckbox.is(':checked'));
					},
					toggleAnimationView = function () {
						if ($step1_tools_animator_switchCheckbox.is(':checked')) {
							startAnimation();
						} else {
							stopAnimation();
						}
						$step1_tools_animator_section._toggle($step1_tools_animator_switchCheckbox.is(':checked')); // Bitwise evaluates both! (Unrelated to here)
					},
					enhanceJQuery = function () {
						$.isUn = function (ob) { return typeof(ob)==='undefined'; }
						$.fn._hide = function () {
							$(this).addClass('hidden');
							return $(this);
						}
						$.fn._show = function () {
							$(this).removeClass('hidden');
							return $(this);
						}
						$.fn._toggle = function (flag) {
							flag ? this._show() : this._hide();
							return $(this);
						}
					},
					startAnimation = function () {
						setTimeout(function(){ // Timeout to respond after upDowns
							var angle = +$step1_tools_animator_angleInput.val(),
								radius = +$step1_tools_animator_radiusInput.val(),
								params = getShapeParams();
							if (params.type && isValid[params.type]()) {
								stopAnimation();
								intervals.push(
									setInterval(function () {  /// Animation Interval ///
										+radius && (params.radius += radius);
										if (params.rotation.rotate) {
											params.rotation.theta += angle;
										}
										drawStack();
										canvas.shape(params);

									}, +$step1_tools_animator_intervalInput.val())
								)
							}
						},0)
					},
					stopAnimation = function (clearCurrent) {
						clearCurrent && cancelAnimationFrame(intervals[-1]);
						intervals.map(function(int) { clearInterval(int) });
						intervals = [];
						animationIsOn = false;
					},
					bindColorMap = function () {
						$step1_color_map_wrapper.find('area').each(function (th) {
							var color = $(this).data('color-code');
							$(this).click(function () {
								$step1_colorInput.val('#' + color).css('border-color', '#' + color).trigger('change');
								$step1_color_map_wrapper._hide();

							})
						});
						$step1_colorInput.on('focus', function () {
							$step1_color_map_wrapper._show();
						})
					},
					degreeModeMaker = function ($neighbourElem) {
						return function () {
							var oldVal = +$neighbourElem.val(), newVal;

							if ($(this).is(':checked')) { // To Degrees
								newVal = round.two(oldVal * 180 / pi);
							} else { // To Radian
								newVal = round.any(oldVal * pi / 180, 5);
							}

							$neighbourElem.val(newVal);
						}
					},
					pad = function (str, count) {
						return Array(count - str.length + 1).join('0') + str;
					},
					random = function (min, max) {
						return Math.random()*(max-min)+min;
					},
					randomR = function (min, max) {
						return parseInt(random(min, max));
					},
					randomHex = function (min, max) {
						return pad(randomR(min, max).toString(16), 2);
					},
					randomizeParams = function () {
						if ($step1_radiosPolygon.is(':checked')){
							$step2_polygon_edges.val(randomR(3, 9));
							$step2_polygon_radius.val(randomR(20, 120));
						}

						if ($step1_radiosSpiral.is(':checked') && $step2_spiral_radiosCustom.is(':checked')){
							$step2_spiral_ratioCustom.val(random(0.5, 1));
						}

						if ($step1_tools_iterator_switchCheckbox.is(':checked')) {
							$step1_tools_iterator_limitInput.val(randomR(5, 250));
							$step1_tools_iterator_angleInput.val(random(-0.08, 0.08));
							$step1_tools_iterator_radiusInput.val(randomR(0, 10));
						}

						if ($step1_tools_animator_switchCheckbox.is(':checked')) {
							$step1_tools_animator_intervalInput.val(randomR(10, 50));
							$step1_tools_animator_angleInput.val(random(-0.02, 0.02));
							//$step1_tools_animator_radiusInput.val(randomR(0, 10));
						}

						$step1_colorInput.val('#' + randomHex(0, 255) + randomHex(0, 255) + randomHex(0, 255))

						generateShape();
					};

				bindColorMap();
				enhanceJQuery();

				// Step 1 //
				// First step radios
				$step1_radios.change(toggleTypeView);

				// Bind up/downs
				$step1_coords
						.add($step1_tools_rotator_axisCustomInputs)
							.on("keydown", makeUpDownFunction(ranges.x, 10)); // Use x's for both, separatable tho
				$step2_polygon_edges.on("keydown", makeUpDownFunction(ranges.edges));
				$step2_polygon_radius.on("keydown", makeUpDownFunction(ranges.radius, 10));
				$step2_spiral_ratioCustom.on("keydown", makeUpDownFunction(ranges.ratio, 0.0075));
				$step1_tools_rotator_angleInput.on("keydown", makeUpDownFunction(ranges.rotationAngle, 0.1));
				$step1_tools_iterator_limitInput.on("keydown", makeUpDownFunction(ranges.iterationLimit, 1));
				$step1_tools_iterator_angleInput.on("keydown", makeUpDownFunction(ranges.iterationAngle, 0.05));
				$step1_tools_iterator_radiusInput.on("keydown", makeUpDownFunction(ranges.iterationRadius, 1));

				$step1_tools_animator_intervalInput.on("keydown", makeUpDownFunction(ranges.iterationLimit, 16));
				$step1_tools_animator_angleInput.on("keydown", makeUpDownFunction(ranges.iterationAngle, 0.05));
				$step1_tools_animator_radiusInput.on("keydown", makeUpDownFunction(ranges.iterationRadius, 1));

				$step1_coords
						.add($step1_tools_rotator_switchCheckbox)
						.add($step1_tools_rotator_angleInput)
						.add($step1_tools_rotator_axisCustomInputs)
						.add($step1_tools_iterator_inputs)
						.add($step2_polygon_inputs)
						.add($step2_spiral_ratioCustom)
							.on("keydown", generateShape)

				$step1_tools_rotator_axisRadios
						.add($step1_radios)
						.add($step1_tools_rotator_angleModeCheckbox)
						.add($step1_tools_rotator_switchCheckbox)
						.add($step1_colorInput)
						.add($step2_spiral_radios)
						.add($step1_tools_animator_switchCheckbox)
							.change(generateShape)

				$step1_tools_rotator_switchCheckbox.change(toggleRotationView);
				$step1_tools_iterator_switchCheckbox.change(toggleIterationView);

				// Restart animation on playage /// Can delete?
				$controls_inputs.on("keydown", toggleAnimationView);

				$step2_spiral_ratioCustom.on("focus", function(){
					$step2_spiral_radiosCustom.prop('checked', true).change();
				})

				$step1_tools_rotator_angleModeCheckbox.change(degreeModeMaker($step1_tools_rotator_angleInput));
				$step1_tools_iterator_degMode.change(degreeModeMaker($step1_tools_iterator_angleInput));
				$step1_tools_animator_degMode.change(degreeModeMaker($step1_tools_animator_angleInput));

				$step1_tools_markersSwitch.change(function () {
					if ($(this).is(':checked')) {
						canvas.markers();
					} else {
						drawStack();
						generateShape();
					}
				})
				$step1_tools_pushToStack.click(saveShapeToStack);

				$stack_startAnimations.click(startStackAnimations);
				$stack_stopAnimations.click(function () {
					stopAnimation(true);
				})
				$stack_clearStack.click(function () {
						exportShapeStack = [];
						shapeStack = [];
						canvas.clear();
						updateStackIndication();
						generateShape();
						$stack_block_controls_saveToLS.text('Save to LocalStorage *');
					})

				$step1_center_wrapper.find('button').click(function () { // Center Shape
					var sCenter, curX, curY,
						x = $canvas.width() /2,
						y = $canvas.height()/2;

					if ($step1_radios.filter(':checked').val() === 'spiral' && isValid.coords() && isValid.spiral()) {
						curX = +$step1_coordsX.val();
						curY = +$step1_coordsY.val();

						sCenter = canvas.getSpiralCenter(getShapeParams());

						$step1_coordsX.val(round.two(curX - (sCenter.x - x)));
						$step1_coordsY.val(round.two(curY - (sCenter.y - y)));
					} else {
						$step1_coordsX.val(x);
						$step1_coordsY.val(y);
					}
					generateShape();
					toggleAnimationView();
				})
				$stack_empty.click(localStorage.setItem.bind(localStorage, 'stack', ''))

				$stack_block_controls_saveToLS.click(saveCurrentStackToLocalStorage);
				$stack_modal.find('.stack-delete').click(deleteFromStack);
				$stack_modal.find('.stack-load-params').click(loadParamsFromStack);

				$step1_tools.find('.tools-randomize').click(randomizeParams);

				// Last action, beginning of scope!
				if (lsStack) {
					importStack(lsStack);
				}

				$(document).keypress(function (e) {
					if (e.keyCode === 83 && e.shiftKey) { // S Push to Stack
						e.preventDefault();
						saveShapeToStack();
					}

					if (e.keyCode === 73 && e.shiftKey) { // I Import
						var input = prompt('Please insert JSON instructions');
						try {
							importStack(input);
						} catch (err) {
							alert('Corrupt JSON, import failed');
						}
					}

					if (e.keyCode === 69 && e.shiftKey) { // E Export
						$stack_exportOutputInput.html(JSON.stringify(exportShapeStack))
						$stack_exportWrapper.fadeIn(800);
					}
				});

				$(document).click(function (e) {
					var flag =
							$(e.target).hasClass('stack-inspect') ||
							$stack_modal.is(e.target) ||
							jQuery.contains($stack_modal[0], e.target);

					if ($stack_modal.is(':visible')) { // Only fumble with it if is visible (Don't raise the dead)
						$stack_modal._toggle(flag);
					}

				})
			},
			mainCanvas = new geometryMaker("canvas0"),
			uiInstance = new ui(mainCanvas);