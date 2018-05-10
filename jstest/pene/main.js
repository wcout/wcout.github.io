/*

	JScriptrator - minimalistic arcade game in Javascript.

	"A first attempt of a long-time C++ programmer to learn Javascript"

	(c) 2018 wcout <wcout@gmx.net>

	I decided to start learning Javascript by doing, so I set myself the
	goal to recode my arcade C++ game FLTrator (https://github.com/wcout/FLTrator),
	which uses FLTK (www.fltk.org) to Javascript.

	The HTML5 canvas API is very similar to the basic drawing routines
	of FLTK, which made the conversion generally straightforward.

	I am using and mixing all ECMA script standards up to ES6 here in one
	program, because it lets me stay close to C++. My resources have only been
	the Mozilla Canvas API (https://developer.mozilla.org/de/docs/Web/HTML/Canvas)
	and my favourite search engine..

	But please don't use this program to learn Javascript - it will probably
	considered as 'using strange practices' by experienced Javascript programmers...

	Tested with Firefox 59 and Chromium browser 65 (must be started with
	'--allow-file-access-from-files'	when running locally).

	NOTE: The 'Original' has been transcoded faithfully, but not identical and
	      not completely. The goal was only to prove that it can be done. As this
	      goal has been reached, I don't feel motivated enough to port all aspects.

*/
//"use strict";

// object id's
const O_ROCKET = 1;
const O_DROP = 2;
const O_BADY = 4;
const O_CLOUD = 8;
const O_RADAR = 16;
const O_PHASER = 32;
const O_COLOR_CHANGE = 64;
const O_SHIP = 128;
const O_MISSILE = 256;
const O_BOMB = 512;
const O_DECO = 1024;
const O_EXPLOSION = 2048;
const O_PHASER_BEAM = 4096;

// lives/level
const LIVES = 5;

// keycodes for game
const KEY_PAUSE = 57;   // '9'
const KEY_RIGHT = 39;   // 'p'
const KEY_ARROW_RIGHT = 80;
const KEY_LEFT = 37;    // 'o'
const KEY_ARROW_LEFT = 79;
const KEY_UP = 38;      // 'q'
const KEY_ARROW_UP = 81;
const KEY_DOWN = 40;    // 'a'
const KEY_ARROW_DOWN = 65;
const KEY_FIRE = 32;    // space
const KEY_SOUND = 83;   // 's'

const KEY_FULLSCREEN = 122; // F11

//var _TEST_ = true;

const fps = 60; // default of requestAnimationFrame()
const dx = Math.floor( 200 / fps ); // desired scroll speed is 200 px/sec.
const dxc = Math.floor( fps / ( 200 - ( fps * dx ) ) );

const SCREEN_W = 800;
const SCREEN_H = 600;

var Screen;
var ctx;
var LS = [];
var LS_colors = [];
var LS_param = [];

// images
var mute;
var ship;
var rocket;
var rocket_launched;
var radar;
var drop;
var bomb;
var bady;
var cloud;
var phaser;
var phaser_active;
var deco;

var spaceship; // ship object
var ox = 0;
var frame = 0;
var last_bomb_frame = 0;
var keysDown = [];
var level = 1;
var objects = [];
var sounds = true;

// sounds
var drop_sound;
var rocket_launched_sound;
var missile_sound;
var bomb_sound;
var phaser_sound;
var x_missile_sound;
var x_bomb_sound;
var x_drop_sound;
var x_ship_sound;
var bady_hit_sound;
var win_sound;
var bg_music;
var bg2_music;
var title_music;
var music;

var max_ground = 0;
var max_sky = 0;

// gradients
var sky_grad;
var bg_grad;
var ground_grad;

var paused = false;
var collision = false;
var completed = false;
var failed_count = 0;
var repeated_right = -5;
var speed_right = 0;

var stars = [];
var shipTPM = [];
var requestId;
var done_count = 0;

class Gradient
{
	constructor( from, to, type = 0 )
	{
		// type: 0 = vertical, 1 = horizontal
		this.grad = ctx.createLinearGradient( 0, type ? SCREEN_H : 0,
		                                      type ? SCREEN_W : 0, SCREEN_H );
		this.grad.addColorStop( 0, from );
		this.grad.addColorStop( 1, to );
	}
}

class Fl_Rect
{
	constructor( x, y, w, h )
	{
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}
	intersects( r )
	{
		return ! ( this.x + this.w - 1 < r.x  ||
		           this.y + this.h - 1 < r.y  ||
	              this.x > r.x + r.w - 1     ||
		           this.y > r.y + r.h - 1 );
	}
	intersection_rect( r )
	{
		var x = Math.max( this.x, r.x );
		var y = Math.max( this.y, r.y );
		var xr = Math.min( this.x + this.w, r.x + r.w );
		var yr = Math.min( this.y + this.h, r.y + r.h );
		if ( xr > x && yr > y )
			return new Fl_Rect( x, y, xr - x, yr - y );
		return new Fl_Rect( 0, 0, 0, 0 );
	}
	relative_rect( r )
	{
		return new Fl_Rect( r.x - this.x, r.y - this.y, r.w, r.h );
	}
	contains( r )
	{
		return this.within( r.x, r.y, this ) &&
		       this.within( r.x + r.w - 1, r.y + r.h - 1, this );
	}
	inside( r )
	{
		return this.within( this.x, this.y, r ) &&
		       this.within( this.x + this.w - 1, this.y + this.h - 1, r );
	}
	within( x, y, r )
	{
		return x >= r.x && x < r.x + r.w &&
		       y >= r.y && y < r.y + r.h;
	}

}

function fl_font( family, size )
{
	var s = family.split( ' ' );
	var f = '';
	if ( s.length >= 2 )
	{
		f = s[1] + ' ';
	}
	if ( s.length >= 3 )
	{
		f += s[2] + ' ';
	}
	f += size + 'px ' +  s[0];
	ctx.font = f;
}

function drawShadowText( text, x, y, color_text, color_shadow, offset = 2 )
{
	fl_color( color_shadow );
	fl_draw( text, x + offset, y + offset );
	fl_color( color_text );
	fl_draw( text, x, y );
}

function fillTextMultiLine( text, x, y )
{
	var lines = text.split( "\n" );
	if ( lines.length == 1 )
	{
		ctx.fillText( text, x, y );
	}
	else
	{
		var lineHeight = ctx.measureText( "M" ).width * 1.2;
		for ( var i = 0; i < lines.length; i++ )
		{
			if ( lines[i].length )
			{
				ctx.fillText( lines[i], x, y );
			}
			y += lineHeight;
		}
	}
}

function fl_draw( text, x, y )
{
	fillTextMultiLine( text, x, y );
}

function fl_align( align = 'start' )
{
	ctx.textAlign = align;
}

function fl_color( c )
{
	ctx.strokeStyle = c;
	ctx.fillStyle = c;
}

function fl_xyline( x0, y, x1 )
{
	ctx.beginPath();
	ctx.moveTo( x0, y );
	ctx.lineTo( x1, y );
	ctx.stroke();
}

function fl_yxline( x, y0, y1 )
{
	ctx.beginPath();
	ctx.moveTo( x, y0 );
	ctx.lineTo( x, y1 );
	ctx.stroke();
}

function fl_line_style( type, width )
{
	if ( width )
	{
		ctx.lineWidth = width;
	}
	else
	{
		ctx.lineWidth = 1;
	}
}

function fl_rectf( x, y, w, h )
{
	ctx.fillRect( x, y, w, h );
}

function resetGameStats()
{
	console.log( 'resetGameStats' );
	window.localStorage.removeItem( 'level' );
	window.localStorage.removeItem( 'done_count' );
}

function setLevel( l )
{
	level = l;
	paused = false;
	completed = false;
	keysDown[KEY_FIRE] = true; // exit splash (if currently in)
	resetLevel( false );
}

function loadValue( id, value )
{
	var value;
	if ( typeof( Storage ) != "undefined" )
	{
		value = window.localStorage.getItem( id );
	}
	return value;
}

function saveValue( id, value )
{
	// NOTE: this uses the browser's cookie settings
	if ( typeof( Storage ) != "undefined" )
	{
		window.localStorage.setItem( id, value );
	}
}


class ObjInfo
{
	constructor( type, x, y, image, frames = 1 )
	{
		this.type = type;
		this.x = x;	// absolute x-coord in landscape!
		this.y = y;
		this.image = image; // NOTE: does this create a new copy for each object?
		this.frames = frames;
		this.curr_frame = 0;
		this.cnt = 0;
		this.x0 = this.x;
		this.y0 = this.y;
		this._scale = 1;
		this.image_width = 0;
		this.image_height = 0;
		this.started = false;
		this._exploded = false;
		this.hits = 0;
		if ( this.image )
		{
			this.image_width = this.image.width / this.frames;
			this.image_height = this.image.height;
		}
	}

	setImage( image, frames = 1 )
	{
		this.image = image;
		this.frames = frames;
		this.curr_frame = 0;
		this.image_width = this.image.width / this.frames;
		this.image_height = this.image.height;
	}

	set scale( scale_ )
	{
		this._scale = scale_;
	}

	get scale()
	{
		return this._scale;
	}

	set exploded( exploded_ )
	{
		this._exploded = exploded_;
	}

	get exploded()
	{
		return this._exploded;
	}

	moved_stretch()
	{
		return Math.abs( this.x - this.x0 ) + Math.abs( this.y - this.y0 );
	}

	draw()
	{
		var x = this.x - ox; // x-coord. on screen

		if ( this.frames == 1 && this._scale == 1 )
		{
			ctx.drawImage( this.image, x, this.y );
		}
		else
		{
			ctx.drawImage( this.image, this.image_width * this.curr_frame,
			               0, this.image_width, this.image.height,
			               x, this.y, this.image_width * this._scale, this.image.height * this._scale );
		}
		if ( this._exploded )
		{
			for ( var i = 0; i < this.image_width * this.image_height / 100; i++ )
			{
				fl_color( Math.random() > 0.5 ? 'red' : 'yellow' );
				var fw = this.image_width / 2;
				var fh = this.image_height / 2;
				var rx = Math.random() * this.image_width;
				var ry = Math.random() * this.image_height;
				var rw = Math.random() * fw;
				var rh = Math.random() * fh;
				fl_rectf( x + rx - fw / 2, this.y + ry - fh / 2, rw, rh );
			}
		}
	}

	update()
	{
		this.cnt++;
		if ( ( this.cnt % 10 ) == 0 && this.frames )
		{
			this.curr_frame++;
			if ( this.curr_frame >= this.frames )
			{
				this.curr_frame = 0;
			}
		}
	}
}

class PhaserBeam extends ObjInfo
{
	constructor( x, y, w, h )
	{
		super( O_PHASER_BEAM, x, y, null );
		this.image_width = w;
		this.image_height = h;
	}

	draw()
	{
		var x = this.x - ox;
		ctx.fillStyle = 'red';
		fl_rectf( this.x - ox , this.y, this.image_width, this.image_height );
		fl_line_style( 0, 0 );
	}
}

class Missile extends ObjInfo
{
	constructor( x, y, w, h )
	{
		super( O_MISSILE, x, y, null );
		this.image_width = w;
		this.image_height = h;
	}

	draw()
	{
		var x = this.x - ox; // x-coord. on screen

		var alpha = 1. - this.moved_stretch() / ( SCREEN_W / 2 + 40 ); // FIXME: parameterize
		var rgba = ( LS_colors.missile ? LS_colors.missile : 'rgba(255,255,255,' ) + alpha + ')';
		ctx.fillStyle = rgba;
		fl_rectf( x, this.y, this.image_width, this.image_height );
		fl_line_style( 0, 0 );
	}

	update()
	{
		this.x += 4 * dx;
	}
}

class Cloud extends ObjInfo
{
	constructor( x, y, image )
	{
		super( O_CLOUD, x, y, image );
		this.down = true;
	}

	update()
	{
		super.update();
		if ( this.down )
		{
			this.y++;
			if ( this.y + this.image_height >= SCREEN_H - LS[this.x + this.image_width / 2].ground )
			{
				this.down = !this.down;
			}
		}
		else
		{
			this.y--;
			if ( this.y <= LS[this.x + this.image_width / 2].sky )
			{
				this.down = !this.down;
			}
		}
	}
}

class Bady extends ObjInfo
{
	constructor( x, y, image, frames )
	{
		super( O_BADY, x, y, image, frames );
		this.down = Math.random() > 0.5;
	}

	update()
	{
		super.update();
		if ( this.down )
		{
			this.y++;
			if ( this.y + this.image_height >= SCREEN_H - LS[this.x + this.image_width / 2].ground )
			{
				this.down = !this.down;
			}
		}
		else
		{
			this.y--;
			if ( this.y <= LS[this.x + this.image_width / 2].sky )
			{
				this.down = !this.down;
			}
		}
	}
}

class Bomb extends ObjInfo
{
	constructor( x, y, image, speed_ = 3 )
	{
		super( O_BOMB, x, y, image );
		this.speed = speed_;
	}

	update()
	{
		this.x += Math.ceil( this.speed * dx );
		this.y += dx;
		this.speed /= 1.03;
	}
}

class Rocket extends ObjInfo
{
	constructor( x, y, image, accel_ = 1.01 )
	{
		super( O_ROCKET, x, y, image );
		this.accel = accel_;
		this.yoff = 1;
	}

	update()
	{
		super.update();
		if ( this.started )
		{
			this.y -= Math.floor( this.yoff );
			if ( ( this.cnt % 2 ) == 0 )
			{
				this.yoff *= this.accel;
			}
		}
	}
}

class Drop extends ObjInfo
{
	constructor( x, y, image, accel_ = 1.008 )
	{
		super( O_DROP, x, y, image );
		this.accel = accel_;
		this.yoff = 1;
	}

	update()
	{
		super.update();
		if ( this.started )
		{
			this.y += Math.floor( this.yoff );
			this.yoff *= this.accel;
		}
	}
}

class Phaser extends ObjInfo
{
	constructor( x, y, image )
	{
		super( O_PHASER, x, y, image );
		this.interval = Math.floor( Math.random() * 100 + 100 );
	}

	set exploded( exploded_ )
	{
		super.exploded = exploded_;
		// delete also beam if on
		if ( this.beam )
		{
			for ( var i = 0; i < objects.length; i++ )
			{
				if ( this.beam == objects[i] )
				{
					objects[i].exploded = true;
					break;
				}
			}
		}
	}

	get exploded() // NOTE: this seems required, when overloading setter
	{
		return super.exploded;
	}

	update()
	{
		super.update();
		if ( ( this.cnt % this.interval ) == this.interval - Math.floor( this.interval / 4 ) )
		{
			this.origImage = this.image;
			this.setImage( phaser_active );
		}
		if ( ( this.cnt % this.interval ) == 0 )
		{
			this.started = true;
			this.delay = 0;

			var x = this.x + this.image_width / 2; // x-coord. of center
			var y = LS[this.x + this.image_width / 2].sky;

			this.beam = new PhaserBeam( x - 2, y, 4, this.y - y );
			objects.splice( 0, 0, this.beam );
			playSound( phaser_sound );
		}
		if ( this.started )
		{
			this.delay++;
			if ( this.delay == 20 )
			{
				this.started = false;
				this.setImage( this.origImage )
				for ( var i = 0; i < objects.length; i++ )
				{
					if ( this.beam == objects[i] )
					{
						objects.splice( i, 1 );
						break;
					}
				}
			}
		}
	}
}

class Ship extends ObjInfo
{
	constructor( x, y, image )
	{
		super( O_SHIP, x, y, image );
		this.accel = false;
		this.decel = false;
	}

	draw()
	{
		super.draw();
		if ( this.accel || this.decel )
		{
			fl_color( this.accel ? 'gray' : 'darkmagenta' );
			fl_line_style( 0, 0 );
			ctx.setLineDash( [4, 2] );
			var y0 = this.y + 20;
			var l = 20;
			var x0 = this.x + Math.floor( Math.random() * 3 );
			while ( y0 < this.y + this.image_height - 10 )
			{
				fl_xyline( x0 - ox, y0, x0 - ox + l );
				y0 += 8;
				x0 += 2;
				l += 8;
			}
			ctx.setLineDash( [] );
		}
	}
}

function fullscreen( ele )
{
	var requestFullScreen = ele.requestFullscreen       ||
	                        ele.mozRequestFullScreen    ||
	                        ele.webkitRequestFullScreen ||
	                        ele.msRequestFullscreen;
	requestFullScreen.call( ele );
}

function playSound( sound )
{
	if ( sounds )
	{
		var s = sound.cloneNode();
		s.play();
	}
}

function bgsound( src )
{
	this.sound = document.createElement( "audio" );
	this.sound.src = src;
	this.sound.setAttribute( "preload", "auto" );
	this.sound.setAttribute( "controls", "none" );
	this.sound.setAttribute( "loop", "loop" );
	this.sound.style.display = "none";
	document.body.appendChild( this.sound );
	this.play = function()
	{
		this.sound.play();
	}
	this.stop = function()
	{
		this.sound.pause();
	}
}

function brightenImage( img, adjustment )
{
	var canvas = document.createElement( 'canvas' ); // temp. canvas
	var ctx = canvas.getContext( '2d' );
	canvas.width = img.width;
	canvas.height = img.height;
	ctx.drawImage( img, 0, 0 ); // write image to canvas
	var imageData = ctx.getImageData( 0, 0, img.width, img.height ); // get image data
	var data = imageData.data;

	// 'brighten' data
	for ( var i = 0; i < data.length; i += 4 )
	{
		data[i]     += adjustment;
		data[i + 1] += adjustment;
		data[i + 2] += adjustment;
	}
	ctx.putImageData( imageData, 0, 0 );

	// read back image from canvas
	var image = new Image();
	image.src = canvas.toDataURL( "image/png" );
	image.width = canvas.width;
	image.height = canvas.height;
	return image;
}

function onDecoLoaded()
{
	// WORKAROUND: check if already one deco object in list,
	// (obviously onDecoLoaded() can somehow be activated twice)
	for ( var i = 0; i < objects.length; i++ )
	{
		if ( objects[i].type == O_DECO )
		{
			return;
		}
	}

	deco = brightenImage( deco, 50 );
	var y = max_sky  + Math.floor( Math.random() * ( SCREEN_H - max_sky - max_ground ) );
	var x = Math.floor( Math.random() * LS.length * 2 / 3 ) + SCREEN_W / 2;
	var obj = new ObjInfo( O_DECO, x, y, deco );
	obj.scale = 2;
	objects.push( obj );
}

function finishedMessage()
{
	fl_align( 'center' );
	var x = SCREEN_W / 2;
	fl_font( 'Arial bold italic', 50 );
	drawShadowText( "** YOU DID IT! **", x, 150, 'red', 'gray' );
	fl_font( 'Arial bold', 34 );
	drawShadowText( "You succeeded to conquer all hazards\nand finally reached your destination!",
		 x, 250, 'green', 'white' );
	fl_font( 'Arial bold', 40 );
	drawShadowText( "You are a REAL HERO!", x, 500, 'red', 'white' );
}

function createLandscape()
{
	LS = eval( "Level_" + level ); // assign from variable 'Level_1'
	LS_colors = eval( "Level_" + level + "_colors" );
	LS_param = eval( "Level_" + level + "_param" );
	max_ground = -1;
	max_sky = -1;
	deco = null;

	// add scrollin/scrollout zones
	if ( !LS_param.added_scrollzones )
	{
		var s = LS[0].sky;
		var g = LS[0].ground;
		var obj = 0;
		var item = { sky: s, ground:g, obj:obj };
		for ( var i = 0; i < SCREEN_W / 2; i++ )
		{
			LS.splice( 0, 0, item ); // inserts at begin
		}
		s = LS[LS.length - 1].sky;
		g = LS[LS.length - 1].ground;
		item = { sky: s, ground:g, obj:obj };
		for ( var i = 0; i < SCREEN_W / 2; i++ )
		{
			LS.push( 0, 0, item );
		}
		LS_param.added_scrollzones = true;
	}

	// add deco object if defined in level param
	if ( LS_param.deco != undefined )
	{
		deco = new Image();
		deco.src = LS_param.deco;
		deco.onload = onDecoLoaded; // needed to have the image dimensions available!
	}

	// create starfield (even if not used in level)
	stars = [];
	for ( var i = 0; i < LS.length; i++ )
	{
		if ( Math.random() > 0.95 )
		{
			var y = Math.floor( Math.random() * SCREEN_H );
			var d = Math.floor( Math.random() * 2 ) + 1;
			var star = { y, d };
			stars[i] = star;
		}
	}

	var clouds = [];
	for ( var i = 0; i < LS.length; i++ )
	{
		// calc. max sky/ground values
		if ( LS[i].ground > max_ground )
		{
			max_ground = LS[i].ground;
		}
		if ( LS[i].sky > max_sky )
		{
			max_sky = LS[i].sky;
		}

		// create objects
		var o = LS[i].obj;
		if ( !o )
		{
			continue;
		}
		if ( o == O_ROCKET )
		{
			var accel = 1 + Math.random() / 50;
			var obj = new Rocket( i - rocket.width / 2, SCREEN_H - LS[i].ground - rocket.height, rocket, accel );
			objects.push( obj );
		}
		else if ( o == O_DROP )
		{
			var accel = 1 + Math.random() / 70;
			var obj = new Drop( i - drop.width / 2, LS[i].sky, drop, accel );
			objects.push( obj );
		}
		else if ( o == O_RADAR )
		{
			var frames = 14;
			var w = radar.width / frames;
			var obj = new ObjInfo( o, i - w / 2, SCREEN_H - LS[i].ground - radar.height, radar, frames );
			objects.push( obj );
		}
		else if ( o == O_BADY )
		{
			var frames = 4;
			var w = bady.width / frames;
			var h = SCREEN_H - LS[i].sky - LS[i].ground - bady.height;
			var obj = new Bady( i - w / 2, Math.floor( Math.random() * h ) + LS[i].sky, bady, frames );
			objects.push( obj );
		}
		else if ( o == O_CLOUD )
		{
			var obj = new Cloud( i - cloud.width / 2, LS[i].sky, cloud );
			clouds.push( obj );
		}
		else if ( o == O_PHASER )
		{
			var obj = new Phaser( i - phaser.width / 2, SCREEN_H - LS[i].ground - phaser.height, phaser );
			objects.push( obj );
		}
		else if ( o == O_COLOR_CHANGE )
		{
			;
		}
		else
		{
			console.log( "Unknown object type %d", o );
		}
	}
	// calc. initial ship position (centered between sky/ground)
	var x = 20;
	var cx = x + ship.width / 2;
	var y = LS[cx].sky + ( SCREEN_H - LS[cx].ground - LS[cx].sky - ship.height ) / 2;
	spaceship = new Ship( x, y, ship );
	objects.splice( 0, 0, spaceship );
	spaceship.scale = 6;

	// move cloud objects at end of list
	// (so they will draw above all other objects)
	for ( var i = 0; i < clouds.length; i++ )
	{
		objects.push( clouds[i] );
	}

	ground_grad = ctx.createLinearGradient( 0, SCREEN_H - max_ground, 0, SCREEN_H );
	ground_grad.addColorStop( 0, 'white' );
	ground_grad.addColorStop( 1, LS_colors.ground );

	sky_grad = ctx.createLinearGradient( 0, 0, 0, max_sky );
	sky_grad.addColorStop( 0, LS_colors.sky );
	sky_grad.addColorStop( 1, 'white' );

	bg_grad = ctx.createLinearGradient( 0, 0, 0, SCREEN_H );
	bg_grad.addColorStop( 0, LS_colors.background2 ? LS_colors.background2 : 'white' );
	bg_grad.addColorStop( 1, LS_colors.background );
}

function dropBomb()
{
	var obj = new Bomb( spaceship.x + spaceship.image_width / 2, spaceship.y + spaceship.image_height + 20, bomb );
	objects.splice( 0, 0, obj ); // stay behind cloud!
	playSound( bomb_sound );
}

function fireMissile()
{
	var obj = new Missile( spaceship.x + spaceship.image_width + 20, spaceship.y + spaceship.image_height/2 + 7, 40, 3 );
	objects.splice( 0, 0, obj );
	playSound( missile_sound ); // stay behind cloud!
}

function onResize()
{
	console.log( "onResize: %d x %d", window.innerWidth, window.innerHeight );
	if ( ctx )
	{
		ctx.setTransform( 1, 0, 0, 1, 0, 0 );
		Screen.width = window.innerWidth;
		Screen.height = window.innerHeight;
		ctx.scale( Screen.width / SCREEN_W, Screen.height / SCREEN_H );
	}
}

function onKeyDown( k )
{
	if ( k == KEY_FULLSCREEN )
	{
		console.log( "going fullscreen" );
		fullscreen( Screen );
	}
	if ( k == KEY_PAUSE && frame )
	{
		if ( paused && ( collision || completed ) )
		{
			return;
		}
		paused = !paused;
		if ( !paused )
		{
			music.play();
		}
		else
		{
			music.stop();
		}
	}
	if ( k == KEY_RIGHT || k == KEY_ARROW_RIGHT )
	{
		repeated_right = -5;
		if ( paused && !collision && !completed )
		{
			// resume game
			onKeyDown( KEY_PAUSE );
		}
	}
}

function onKeyUp( k )
{
	if ( paused || collision )
	{
		return;
	}
	if ( k == KEY_SOUND )
	{
		sounds = !sounds;
		saveValue( 'sounds', sounds );
	}
	if ( k == KEY_FIRE && frame )
	{
		if ( frame - last_bomb_frame > 30 ) // simple limit of rate
		{
			last_bomb_frame = frame;
			dropBomb();
		}
	}
	if ( ( k == KEY_RIGHT || k == KEY_ARROW_RIGHT ) && frame )
	{
		speed_right = 0;
		if ( repeated_right <= 0 )
		{
			fireMissile();
		}
	}
}

function onEvent( e )
{
	if ( e.type == "keydown" )
	{
		if ( !keysDown[e.keyCode] ) // this seems necessary, because a keydown event is delivered before each keyup!!
		{
			onKeyDown( e.keyCode );
		}
		keysDown[e.keyCode] = true;
		e.preventDefault();
	}
	if ( e.type == "keyup" )
	{
		keysDown[e.keyCode] = false;
		onKeyUp( e.keyCode );
		e.preventDefault();
	}
	if ( e.type == "mousedown" || e.type == "touchstart" )
	{
		var mx;
		var my;
		if ( e.type == "touchstart" )
		{
			var rect = e.target.getBoundingClientRect();
			mx = e.touches[0].pageX - rect.left;
			my = e.touches[0].pageY - rect.top;
			e.preventDefault();
		}
		else
		{
			mx = e.offsetX;
			my = e.offsetY;
		}
//		console.log( "mouse/touch event at %d/%d", mx, my );
		var cx = spaceship.x + spaceship.image_width / 2 - ox;
		var cy = spaceship.y + spaceship.image_height / 2;
		if ( my > Screen.clientHeight * 0.67 && mx < Screen.clientWidth / 4 )
		{
			// bottom left zone = drop bomb
			keysDown[KEY_FIRE] = true;
			onKeyDown(KEY_FIRE);
			return;
		}
		if ( my > Screen.clientHeight * 0.67 && mx > Screen.clientWidth * 0.75 && frame )
		{
			// bottom right zone = fire missile
			fireMissile();
			return;
		}
		if ( my < Screen.clientHeight / 3 && !frame )
		{
			// top zone in title menu = go fullscreen
			fullscreen( Screen );
			return;
		}
		if ( Math.abs( mx - cx ) > Screen.clientWidth / 40 )
		{
			if ( mx > cx )
			{
				keysDown[KEY_LEFT] = false;
				keysDown[KEY_RIGHT] = true;
				onKeyDown(KEY_RIGHT);
			}
			else
			{
				keysDown[KEY_RIGHT] = false;
				keysDown[KEY_LEFT] = true;
				onKeyDown(KEY_LEFT);
			}
		}
		if ( Math.abs( my - cy ) > Screen.clientWidth / 30 )
		{
			if ( my > cy )
			{
				keysDown[KEY_UP] = false;
				keysDown[KEY_DOWN] = true;
				onKeyDown(KEY_DOWN);
			}
			else
			{
				keysDown[KEY_DOWN] = false;
				keysDown[KEY_UP] = true;
				onKeyDown(KEY_UP);
			}
		}
	}
	if ( e.type == "mouseup" || e.type == "touchend" )
	{
		if ( keysDown[KEY_FIRE] )
		{
			onKeyUp(KEY_FIRE);
		}
		keysDown[KEY_FIRE] = false;
		keysDown[KEY_RIGHT] = false;
		keysDown[KEY_LEFT] = false;
		keysDown[KEY_UP] = false;
		keysDown[KEY_DOWN] = false;
	}
}

function drawObjects( drawDeco = false )
{
	for ( var i = 0; i < objects.length; i++ )
	{
		var o = objects[i];
		if ( drawDeco && o.type != O_DECO )
		{
			continue;
		}
		if ( !drawDeco && o.type == O_DECO )
		{
			continue;
		}
		if ( o.x + o.image_width * o.scale >= ox && o.x < ox + SCREEN_W )
		{
			o.draw();
			if ( frame && !paused && o.type == O_DECO )
			{
				o.x += ( dx - 1 );
			}
		}
	}
}

function collisionWithLandscape()
{
	for ( var y = 0; y < spaceship.image_height; y++ )
	{
		for ( var x = 0; x < spaceship.image_width; x++ )
		{
			if ( !shipTPM[ y * spaceship.image_width + x ] )
			{
				var g = SCREEN_H - LS[ spaceship.x + x].ground;
				if ( spaceship.y + y > g )
				{
					return true;
				}
				var s = LS[ spaceship.x + x].sky;
				if ( spaceship.y + y < s )
				{
					return true;
				}
			}
		}
	}
	return false;
}

function updateObjects()
{
	for ( var i = 0; i < objects.length; i++ )
	{
		var o = objects[i];
		if ( o.exploded )
		{
			objects.splice( i, 1 );
			i--;
			continue;
		}
		var cx = o.x + o.image_width / 2;
		if ( cx >= LS.length || o.x + o.image_width < ox || o.x >= ox + SCREEN_W )
		{
			continue;
		}
		if ( o.type == O_SHIP )
		{
			// check for collision with landscape
			for ( var x = 0; x < o.image_width; x++ )
			{
				if ( ( o.y + o.image_height >= SCREEN_H - LS[o.x + x].ground ) ||
				  ( LS[o.x + x].sky >= 0 && o.y < LS[o.x + x].sky ) )
				{
					if ( collisionWithLandscape() )
					{
						if ( typeof( _TEST_ ) == "undefined" )
						{
							playSound( x_ship_sound );
							collision = true;
							o.scale = 1;
							o.exploded = true;
							resetLevel();
							return;
						}
					}
				}
			}
		}
		else if ( o.type == O_ROCKET )
		{
			if ( !o.started && Math.abs( o.x - spaceship.x ) < SCREEN_W / 2 )
			{
				o.started = ( Math.random() > 0.8 );
				if ( o.started )
				{
					o.setImage( rocket_launched );
					playSound( rocket_launched_sound );
				}
			}
			o.update();
			var sky = LS[cx].sky;
			var gone_y = sky >= 0 ? sky : -o.image_height;
			if ( o.y <= gone_y )
			{
				o.exploded = true;
//				objects.splice( i, 1 );
//				i--;
			}
		}
		else if ( o.type == O_DROP )
		{
			if ( !o.started && Math.abs( o.x - spaceship.x ) < SCREEN_W / 2 )
			{
				o.started = ( Math.random() > .98 );
				if ( o.started )
				{
					playSound( drop_sound );
				}
			}
			o.update();
			if ( o.y > SCREEN_H - LS[cx].ground - o.image.height / 2 )
			{
				objects.splice( i, 1 );
				i--;
			}
		}
		else if ( o.type == O_MISSILE )
		{
			o.update();
			if ( ( SCREEN_H - LS[cx].ground < o.y ) ||
			     ( o.y < LS[cx].sky ) ||
			       o.moved_stretch() > SCREEN_W / 2 ||
			       o.x + o.image_width * o.scale < ox || o.x >= ox + SCREEN_W )
			{
				objects.splice( i, 1 );
				i--;
			}
		}
		else if ( o.type == O_BOMB )
		{
			o.update();
			if ( o.y > SCREEN_H - LS[cx].ground - o.image.height / 2 )
			{
				objects.splice( i, 1 );
				i--;
			}
		}
		else
		{
			// O_RADAR, O_BADY, O_CLOUD, O_PHASER
			o.update();
		}
	}
}

function drawBgPlane()
{
	if ( max_sky >= 0 )
		return;

	// test for "parallax scrolling" background plane
	var xoff = Math.floor( ox / 3 );	// scrollfactor 1/3
	fl_color( LS_colors.plane );
	for ( var i = 0; i < SCREEN_W; i++ )
	{
		if ( ox + i >= LS.length ) break;
		var g2 = SCREEN_H - LS[ ox + i ].ground;
		var g1 = SCREEN_H - LS[ LS.length - xoff - i - 2 * SCREEN_W ].ground * 2 / 3;
		if ( g2 > g1 )
		{
			fl_rectf( i, g1, 2, g2 - g1 );
		}
	}
}

function drawLandscape()
{
	ctx.beginPath();
	var outline_width = (LS_param.outline_width != undefined) ? LS_param.outline_width : 2;
	ctx.lineWidth = outline_width;
	var delta = outline_width ? Math.floor( outline_width / 2 ) + 1 : 0;
	ctx.moveTo( -delta,  SCREEN_H + delta );
	for ( var i = -delta; i < SCREEN_W + delta; i++ )
	{
		var x = ox + i;
		var g = -1;
		if ( x >= 0 && x < LS.length )
		{
			g = LS[x].ground;
		}
		ctx.lineTo( i, SCREEN_H - g );
	}
	ctx.lineTo( SCREEN_W + delta, SCREEN_H + delta );
	ctx.closePath();
	ctx.fillStyle = ground_grad;
	ctx.fill();
	if ( outline_width )
	{
		ctx.strokeStyle = LS_colors.outline ? LS_colors.outline : 'black';
		ctx.stroke();
	}

/*
	var outline_width = (LS_param.outline_width != undefined) ? LS_param.outline_width : 2;
	ctx.lineWidth = outline_width;
	var delta = outline_width ? Math.floor( outline_width / 2 ) + 1 : 0;
*/
	ctx.beginPath();
	ctx.moveTo( -delta, -delta );
	for ( var i = -delta; i < SCREEN_W + delta; i++ )
	{
		var x = ox + i;
		var s = -1;
		if ( x >= 0 && x < LS.length )
		{
			s = LS[x].sky;
		}
		if ( s < 0 && x < LS.length )
		{
			ctx.moveTo( i, s );
		}
		else
		{
			ctx.lineTo( i, s );
		}
	}
	ctx.lineTo( SCREEN_W + delta, -delta );
	ctx.closePath();
	ctx.fillStyle = sky_grad;
	ctx.fill();
	if ( outline_width )
	{
		ctx.strokeStyle = LS_colors.outline ? LS_colors.outline : 'black';
		ctx.stroke();
	}
	fl_line_style( 0, 0 );
}

async function resetLevel( wait_ = true, splash_ = false )
{
	if ( paused )
	{
		return;
	}
	var was_completed = completed;
	var changeMusic = completed || !wait_;
	onKeyDown( KEY_PAUSE ); // trigger pause
	if ( wait_ )
	{
		var done = completed && level == 10;
		if ( done )
		{
			playSound( win_sound );
		}
		else
		{
			failed_count++;
		}
		await sleep( 3000 + 17000 * ( done == true ) );
	}
	collision = false;
	completed = false;
	onKeyDown( KEY_PAUSE );	// end pause

	ox = 0;
	frame = 0;
	last_bomb_frame = 0;
	if ( was_completed )
	{
		level++;
		failed_count = 0;
		music.stop();
	}
	repeated_right = -5;
	speed_right = 0;
	objects = [];
	var splash = splash_ || level > 10 || failed_count >= LIVES;
	if ( level > 10 )
	{
		level = 1;
		done_count++;
		saveValue( 'done', done_count );
	}
	saveValue( 'level', level );
	createLandscape();
	if ( splash )
	{
		splashScreen();
	}
	else
	{
		music.stop();
		if ( changeMusic )
		{
			music = Math.random() > 0.5 ? bg_music : bg2_music;
			music.currentTime = 0; // play from begin
		}
		music.play();
	}
}

function checkHits()
{
	for ( var i = 0; i < objects.length; i++ )
	{
		var o = objects[i];
		if ( o.type == O_DECO || o.type == O_CLOUD || o.exploded )
		{
			continue;
		}
		var rect = new Fl_Rect( o.x, o.y, o.image_width, o.image_height );
		for ( var j = 0; j < objects.length; j++ )
		{
			if ( i == j )
			{
				continue;
			}
			var o1 = objects[j];
			var rect1 = new Fl_Rect( o1.x, o1.y, o1.image_width, o1.image_height );
			if ( o1.type == O_DECO || o1.type == O_CLOUD || o1.exploded )
			{
				continue;
			}
			if ( rect.intersects( rect1 ) )
			{
				if ( o.type == O_SHIP )
				{
					// additionally check if intersection
					// is in non-transparent part of ship
					var ir = rect.intersection_rect( rect1 );
					var rr = rect.relative_rect( ir );
					for ( var x = rr.x; x < rr.x + rr.w; x++ )
					{
						for ( var y = rr.y; y < rr.y + rr.h; y++ )
						{
							if ( !shipTPM[ y * ship.width + x ] )
							{
								if ( typeof( _TEST_  ) == "undefined" )
								{
									playSound( x_ship_sound );
									collision = true;
									o.scale = 1;
									o.exploded = true;
									o1.exploded = true;
									resetLevel();
									return;
								}
							}
						}
					}
				}
				else if ( o.type == O_MISSILE && ( o1.type == O_ROCKET || o1.type == O_DROP ||
				                                   o1.type == O_RADAR  || o1.type == O_BADY ||
				                                   o1.type == O_PHASER ) )
				{
					o1.hits++;
					o.exploded = true;
//					objects.splice( i, 1 ); // missile gone
//					i--;
//					j--; // !!!
					if ( o1.type == O_BADY && o1.hits < 3 + Math.floor( level / 3 )  )
					{
						return;
					}
					if ( o1.type == O_RADAR && o1.hits < Math.floor( level / 3 ) )
					{
						return;
					}
					o1.exploded = true;
//					objects.splice( j, 1 );
					if ( o1.type == O_DROP )
					{
						playSound( x_drop_sound );
					}
					else if ( o1.type == O_BADY )
					{
						playSound( bady_hit_sound );
					}
					else
					{
						playSound( x_missile_sound );
					}
					return;
				}
				else if ( o.type == O_BOMB && ( o1.type == O_RADAR || o1.type == O_ROCKET || o1.type == O_PHASER ) )
				{
					if ( o1.type != O_PHASER && !rect.inside( rect1 ) ) // bomb must be inside radar (looks better)
					{
						continue;
					}
					o1.exploded = true;
//					objects.splice( j, 1 ); // NOTE: this has to be before object.splice( i, 1 ) - WHY?
//					j--;
					o.exploded = true;
//					objects.splice( i, 1 ); // bomb gone too!
//					i--;
					playSound( x_bomb_sound );
				}
			}
		}
	}
}

function drawLevel()
{
	fl_color( 'cyan' );
	ctx.fillStyle = bg_grad;
	fl_rectf( 0, 0, SCREEN_W, SCREEN_H );

	if ( LS_param.stars )
	{
		fl_color( 'yellow' );
		var sx = Math.floor( ox / 10 );
		for ( var i = sx; i < sx + SCREEN_W; i++ )
		{
			if ( stars[i] )
			{
				fl_rectf( i - sx, stars[i].y, stars[i].d, stars[i].d );
			}
		}
	}

	drawObjects( true ); // deco only

	drawBgPlane();
	drawLandscape();
	drawObjects();

	fl_font( 'Arial bold', 30 );
	fl_align();
	drawShadowText( 'Level ' + level, 10, SCREEN_H - 30, 'white', 'gray', 1 );
}

function update()
{
	frame++;
	requestId = window.requestAnimationFrame( update );
	if ( spaceship.scale > 1 )
	{
		spaceship.scale = spaceship.scale - 0.1;
	}
	if ( !paused )
	{
		updateObjects();
		checkHits();
	}
	// handle color change
	var changed = false;
	for ( var i = ox; i < ox + SCREEN_W / 2; i++ )
	{
		if ( LS[i].bg_color != undefined )
		{
			bg_grad = new Gradient( LS_colors.background2 ? LS_colors.background2 : 'white',
			                        LS[i].bg_color ? LS[i].bg_color : LS_colors.background ).grad;
			changed = true;
		}
		if ( LS[i].sky_color != undefined )
		{
			sky_grad = new Gradient( LS[i].sky_color ? LS[i].sky_color : LS_colors.sky, 'white' ).grad;
			changed = true;
		}
		if ( LS[i].ground_color != undefined )
		{
			ground_grad = new Gradient( 'white', LS[i].ground_color ? LS[i].ground_color : LS_colors.ground ).grad;
			changed = true;
		}
		if ( changed )
		{
			break;
		}
	}

	drawLevel();

	if ( !sounds )
	{
		var text = '\u{1f507}'; // unicode character 'speaker with cancellation stroke'
		var x = SCREEN_W - 40;
		var y = SCREEN_H - 40;
//		ctx.fillText( text, x, y );
		ctx.drawImage( mute, x, y, 30, 30 );
	}

	// draw lives
	for ( var i = 0; i < LIVES - failed_count; i++ )
	{
		var w = ship.width / 4;
		var h = ship.height / 4;
		var x = 10 + ( w + 5 ) * i;
		var y = SCREEN_H - 20;
		ctx.drawImage( ship, 0, 0, ship.width, ship.height,
                     x , y , w, h );
	}

	if ( LS_param.name && ox < SCREEN_W / 2 )
	{
		fl_font( 'Arial bold italic', Math.min( Math.floor( ox / 3 ), 40 ) );
		var w = ctx.measureText( LS_param.name ).width;
		var x = ( SCREEN_W - w ) / 2;
		drawShadowText( LS_param.name, x, 50, 'yellow', 'black', 2 );
	}

	spaceship.accel = false;
	spaceship.decel = false;
	if ( !collision && !paused )
	{
		var k = keysDown;
		if ( k[KEY_RIGHT] || k[KEY_ARROW_RIGHT] )
		{
			repeated_right++;
			if ( repeated_right > 0 )
			{
				if ( spaceship.x + spaceship.image_width / 2 < ox + SCREEN_W / 2 )
				{
					spaceship.x += dx;
					speed_right++;
					spaceship.accel = true;
				}
			}
		}
		if ( k[KEY_LEFT] || k[KEY_ARROW_LEFT])
		{
			if ( spaceship.x >= ox - spaceship.image_width / 2 )
			{
				spaceship.x -= dx;
				spaceship.decel = true;
			}
		}
		if ( k[KEY_DOWN] || k[KEY_ARROW_DOWN] )
		{
			if ( spaceship.y + spaceship.image_height < SCREEN_H )
			{
				spaceship.y += dx;
			}
		}
		if ( k[KEY_UP] || k[KEY_ARROW_UP] )
		{
			if ( spaceship.y >= 0 )
			{
				spaceship.y -= dx;
			}
		}
	}

	if ( !paused || completed )
	{
		var delta = ( frame % dxc == 0 );
		ox += ( dx + delta );
		spaceship.x += ( dx + delta );
	}
	if ( ox + SCREEN_W >= LS.length )
	{
		ox = LS.length - SCREEN_W;
		completed = true;
		resetLevel();
	}
	if ( paused )
	{
		if ( completed && level == 10 )
		{
			finishedMessage();
		}
		else
		{
			fl_font( 'Arial bold italic', 50 );
			fl_align( 'center' );
			drawShadowText( collision ? "*** OUCH!! ***" : completed ?
				"Level complete!" : "*** PAUSED ***", SCREEN_W / 2, 300, 'white', 'gray', 2 );
		}
	}
}

function getTransparencyMask( img )
{
	var canvas = document.createElement( 'canvas' ); // temp. canvas
	var ctx = canvas.getContext( '2d' );
	canvas.width = img.width;
	canvas.height = img.height;
	ctx.drawImage( img, 0, 0 ); // write image to canvas
	var imageData = ctx.getImageData( 0, 0, img.width, img.height ); // get image data
	var data = imageData.data;

	var mask = [];
	for ( var i = 0; i < data.length; i += 4 )
	{
		mask[i / 4] = ( data[ i + 3 ] == 0 );
	}
	return mask;
}

async function splashScreen()
{
	window.cancelAnimationFrame( requestId );
	document.querySelector( 'footer' ).style.display = 'block';
	failed_count = 0;
	if ( music )
	{
		music.stop();
	}
	music = title_music;
	music.currentTime = 0; // play from begin
	music.play();

	var scale = 2;
	keysDown[KEY_FIRE] = false;
	var gradient = new Gradient( 'skyblue', 'saddlebrown' );
	var sneak_time = 2 * fps;
	var cnt = sneak_time;
	var sx = spaceship.x;
	while ( !keysDown[KEY_FIRE] )
	{
		cnt++;
		var cyc = cnt % ( fps * 15 );
		if ( cyc == sneak_time )
		{
			ox = Math.floor( Math.random() * ( LS.length - 2 * SCREEN_W ) );
			spaceship.x = sx;
			scale = 2;	// if title gets visible again, restart animation fron begin
		}
		if ( cyc < sneak_time )
		{
			spaceship.scale = 1;
			drawLevel();
			ox++;
			if ( spaceship.x > ox )
			{
				spaceship.x++;
			}
		}
		else
		{
			ctx.fillStyle = gradient.grad;
			fl_rectf( 0, 0, SCREEN_W, SCREEN_H );
		}

		fl_font( 'Arial bold italic', 90 );
		ctx.save();
		ctx.rotate( -4 * Math.PI / 180 );
		var text = 'JScriptrator';
		var w = ctx.measureText( text ).width;
		var x = ( SCREEN_W - w ) / 2;
		drawShadowText( text, x, 120, 'red', 'darkgray', 4 );
		ctx.restore();

		fl_align( 'center' );
		fl_font( 'Arial bold', 26 );
		text = '(c) 2018 wcout';
		ctx.textAlign = "center";
		x = SCREEN_W / 2;
		drawShadowText( text, x, 150, 'cyan', 'black', 2 );

		fl_font( 'Arial bold italic', 40 );
		text = "Hit space key to start";
		drawShadowText( text, SCREEN_W / 2, SCREEN_H - 30, 'yellow', 'black', 2 );
		fl_align();

		if ( cyc >= sneak_time )
		{
			fl_font( 'Arial bold italic', 30 );
			drawShadowText( 'Level ' + level, 10, SCREEN_H - 30, 'white', 'gray', 1 );

			fl_color( 'white' );
			fl_font( 'Arial', 10 );
			fl_draw( 'v1.0', SCREEN_W - 30, SCREEN_H - 10 );

			var w = ship.width * scale;
			var h = ship.height * scale;
			var x = ( SCREEN_W - w ) / 2;
			var y = ( SCREEN_H - h ) / 2;
			ctx.drawImage( ship, 0, 0, ship.width, ship.height,
			               x , y + 40 , w, h );
		}
		await sleep( 10 );
		scale += 0.01;
		if ( scale > 6 )
		{
			scale = 2;
		}
	}
	music.stop();
	playSound( drop_sound );
	document.querySelector( 'footer' ).style.display = 'none';
	requestId = window.requestAnimationFrame( update );
	resetLevel( false );
}

function onResourcesLoaded()
{
	createLandscape();

	shipTPM = getTransparencyMask( ship );

	document.addEventListener( "keydown", onEvent );
	document.addEventListener( "keyup", onEvent );
	Screen.addEventListener( "mousedown", onEvent );
	Screen.addEventListener( "mouseup", onEvent );
	Screen.addEventListener( "touchstart", onEvent );
	Screen.addEventListener( "touchend", onEvent );

	splashScreen();
}

function loadImages()
{
	mute = new Image();
	mute.src = 'mute.svg';
	ship = new Image();
	ship.src = 'ship.gif';
	rocket = new Image();
	rocket.src = 'rocket.gif';
	rocket_launched = new Image();
	rocket_launched.src = 'rocket_launched.gif';
	radar = new Image();
	radar.src = 'radar.gif';
	bomb = new Image();
	bomb.src = 'bomb.gif';
	bady = new Image();
	bady.src = 'bady.gif';
	cloud = new Image();
	cloud.src = 'cloud.gif';
	phaser = new Image();
	phaser.src = 'phaser.gif';
	phaser_active = new Image();
	phaser_active.src = 'phaser_active.gif';
	drop = new Image();
	drop.src = 'drop.gif';
	drop.onload = onResourcesLoaded; // needed to have the image dimensions available!
}

function loadSounds()
{
	drop_sound = new Audio( 'drop.wav' );
	rocket_launched_sound = new Audio( 'rocket_launched.wav' );
	bomb_sound = new Audio( 'bomb.wav' );
	missile_sound = new Audio( 'missile.wav' );
	phaser_sound = new Audio( 'phaser.wav' );
	x_bomb_sound = new Audio( 'x_bomb.wav' );
	x_missile_sound = new Audio( 'x_missile.wav' );
	x_drop_sound = new Audio( 'x_drop.wav' );
	x_ship_sound = new Audio( 'x_ship.wav' );
	bady_hit_sound = new Audio( 'bady_hit.wav' );
	win_sound = new Audio( 'win.wav' );
	bg_music = new bgsound( 'bg.wav' );
	bg2_music = new bgsound( 'bg2.wav' );
	title_music = new bgsound( 'title_bg.wav' );
}

function sleep( ms )
{
	return new Promise( resolve => setTimeout( resolve, ms ) );
}

function main()
{
	console.log( "dx = %d, dxc = %d", dx, dxc );
	loadSounds();
	loadImages();

	window.addEventListener( 'resize', onResize );
	Screen = document.getElementById( 'viewport' );
	Screen.width = window.innerWidth;
	Screen.height = window.innerHeight;
	var rect = new Fl_Rect( 0, 0, SCREEN_W, SCREEN_H ); // test class
	ctx = Screen.getContext( '2d' );
	ctx.scale( Screen.width / SCREEN_W, Screen.height / SCREEN_H );

	fl_color( 'black' );
	fl_rectf( 0, 0, rect.w, rect.h );

	fl_align( 'center' );
	fl_font( 'Arial', 50 );
	fl_color( 'white' );
	fl_draw( "JScriptrator is loading...", rect.w / 2, 300 );
	fl_align();

	var stored_level = loadValue( 'level' );
	if ( stored_level )
	{
		level = stored_level;
	}
	var stored_sounds = loadValue( 'sounds' );
	if ( stored_sounds )
	{
		sounds = stored_sounds;
	}
	done_count = loadValue( 'done' );

}

main();
