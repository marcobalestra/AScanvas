/*
	Canvas extensions for graphics and simple actions
	Author: Marco Balestra <balestra@altersoftware.it>
	Version: 1.0
	Reference: http://altersoftware.it/products/jslibs/canvas-reference
*/

if (!Array.isArray) Array.isArray = function(arg) { return Object.prototype.toString.call(arg) === '[object Array]'; };

if ( ! AScanvas ) var AScanvas = {};

/* Defaul properties */
if ( ! AScanvas.defaults ) AScanvas.defaults = {};
AScanvas.defaults.label = { font: 'normal 10px verdana', color: '#fff', borderWidth : 2, borderColor: 'rgba(0,0,0,.8)' };
AScanvas.defaults.shadowColor = 'rgba(0,0,0,.5)';

/*
	To emulate OO with bitmap tools, an array of properties is created and applied in sequence at draw() time.
	Every object has an array property named "args", each entry of it is an object with 3 keys:
	t: type  - Can be 'op' (object property), 'om' (object method), 'cp' (canvas property) or 'cm' (canvas method).
	           Object properties is actually an object, stored in a specific property named "props".
	k: key   - The name of the property that will be set, or the name of the method that will be invoked.
	v: value - The value the property will be set to, or the array of parameters that will be passed to method.
	
	Abstract methods
*/
if ( ! AScanvas._ ) AScanvas._ = {};
if ( ! AScanvas._.fillStyle ) AScanvas._.fillStyle = function(c) { this.args.push({t:'cp',k:'fillStyle',v:c}); return this; };
if ( ! AScanvas._.lineColor ) AScanvas._.lineColor = function(c) { if(typeof c != 'undefined')this.args.push({t:'cp',k:'strokeStyle',v:c}); return this; };
if ( ! AScanvas._.lineWidth ) AScanvas._.lineWidth = function(w) { this.args.push({t:'cp',k:'lineWidth',v:AScanvas._.size.call(this,w)}); return this; };
if ( ! AScanvas._.lineStyle ) AScanvas._.lineStyle = function(w,c) { AScanvas._.lineWidth.apply(this,[w]); if(c) AScanvas._.lineColor.apply(this,[c]); return this; };
if ( ! AScanvas._.scale ) AScanvas._.scale = function() { this.args.push({t:'cm',k:'scale',v:arguments}); return this; };
if ( ! AScanvas._.rotate ) AScanvas._.rotate = function(a) {
	a = AScanvas._.angle( a );
	if ( a != 0) this.args.push({t:'cm',k:'rotate',v:[a]});
	return this;
};
if ( ! AScanvas._.angle ) AScanvas._.angle = function(a) {
	if ( typeof a == 'string' ) {
		var err;
		try {
			var isDegree = ( a.indexOf('°') != -1 );
			if ( isDegree ) a = a.replace(/°/g,'');
			a = parseFloat( eval(a) );
			if ( isDegree ) a = Math.PI * a / 180;
		} catch(err) {
			a = 0;
		}
	}
	return a;
};
if ( ! AScanvas._.size ) AScanvas._.size = function(v, context) {
	if ( typeof context == 'undefined' ) context = this.context ? this.context : ( this.getContext ? this.getContext("2d") : ( this.canvas ? this : { canvas : { width: 0, height: 0 }} ) );
	if ( typeof v == 'string' ) {
		if ( v === '' ) {
			v = 0;
		} else {
			var err;
			try {
				v = v.replace(/w/g, context.canvas.width );
				v = v.replace(/h/g, context.canvas.height );
				v = Math.round( eval(v) );
			} catch(err) {
				try {
					console.log( "'" + v + "' error: " + err );
				} catch(err) {}
				v = 0;
			}
		}
	}
	return v;
};
if ( ! AScanvas._.shadow ) AScanvas._.shadow = function(x,y,b,c) {
	x = AScanvas._.size.call(this,x);
	y = ( typeof y == 'undefined' ) ? x : AScanvas._.size.call(this, y);
	b = ( typeof b == 'undefined' ) ? Math.round((x+y)/2) : AScanvas._.size.call(this, b);
	if ( typeof c == 'undefined' ) c = AScanvas.defaults.shadowColor;
	this.args.push({t:'cp',k:'shadowOffsetX',v:x},{t:'cp',k:'shadowOffsetY',v:y},{t:'cp',k:'shadowBlur',v:b},{t:'cp',k:'shadowColor',v:c});
	return this;
}
if ( ! AScanvas._.textAlign ) AScanvas._.textAlign = function(a) { this.args.push({t:'cp',k:'textAlign',v:a}); return this; };
if ( ! AScanvas._.textBaseline ) AScanvas._.textBaseline = function(b) { this.args.push({t:'cp',k:'textBaseline',v:b}); return this; };
if ( ! AScanvas._.translate ) AScanvas._.translate = function(x,y) { this.args.push({t:'cm',k:'translate',v:[AScanvas._.size.call(this,x),AScanvas._.size.call(this,y)]}); return this; };
if ( ! AScanvas._.font ) AScanvas._.font = function(f) { this.args.push({t:'cp',k:'font',v:f.toString()}); return this; };
if ( ! AScanvas._.draw ) AScanvas._.draw = function() {
	for ( var i = 0; i < this.args.length; i++ )  switch ( this.args[i].t ) {
		case 'op' : this.props[ this.args[i].k ] = this.args[i].v; break;
		case 'om' : this[ this.args[i].k ].apply(this,this.args[i].v); break;
		case 'cp' : this.context[ this.args[i].k ] = this.args[i].v; break;
		case 'cm' : this.context[ this.args[i].k ].apply(this.context,this.args[i].v); break;
	}
};
if ( ! AScanvas._.fontStringParse ) {
	AScanvas._.fontStringParse = function( fs ) {
		fs = fs.replace(/ +/g,' ').replace(/^ /,'').replace(/ $/,'');
		var r = {};
		if ( fs.match(/(caption|icon|menu|message-box|small-caption|status-bar)$/) ) {
			r.special = fs.indexOf(' ') != -1 ? fs.replace(/^.* ([^ ]+)$/,"$1") : fs;
		} else {
			var w = fs.split(' ');
			if ( w[0] && w[0].match(/^(normal|italic|oblique)$/) ) r.style = w.shift();
			if ( w[0] && w[0].match(/^(normal|small-caps)$/) ) r.variant = w.shift();
			if ( w[0] && w[0].match(/^(normal|bold|bolder|lighter|[0-9]{3,4})$/) ) r.weight = w.shift();
			if ( w[0] && w[0].match(/^[0-9]+px$/) ) r.size = parseInt(w.shift().replace(/px/,''));
			if ( w[0] ) r.family = w.shift();
			if ( r.style == 'normal' ) {
				if ( ! r.variant ) r.variant = 'normal';
				if ( ! r.weight ) r.weight = 'normal';
			}
		}
		return r;
	}
};
if ( ! AScanvas._.fontToString ) {
	AScanvas._.fontToString = function( f ) {
		if ( typeof f == 'undefined' ) f = this.fontObject ? this.fontObject : {};
		if ( f.special ) return f.special;
		var s = [];
		if ( f.style ) s.push( f.style );
		if ( f.variant ) s.push( f.variant );
		if ( f.weight ) s.push( f.weight );
		if ( f.size ) s.push( String(f.size)+'px' );
		if ( f.family ) s.push( f.family );
		return s.join(' ');
	}
};

/* OO context methods, will start with "_" */

if ( ! AScanvas.font ) {
	AScanvas.font = function( context, fs ) {
		this.context = context;
		this.toString = AScanvas._.fontToString;
		this.fontObject = AScanvas._.fontStringParse( String(this.context.font) );
		this.setProperty = function( p, v ) { this.fontObject[p]=v; if(p!='special')this.fontObject.special=undefined; return this; };
		this.family = function(x) { this.fontObject.family=x; return this; };
		this.size = function(x) { this.fontObject.size=AScanvas._.size.call(this,x); return this; };
		this.special = function(x) { this.fontObject.special=x; return this; };
		this.style = function(x) { this.fontObject.style=x; return this; };
		this.variant = function(x) { this.fontObject.variant=x; return this; };
		this.weight = function(x) { this.fontObject.weight=x; return this; };
		this.bold = function() { return this.weight('bold'); };
		this.italic = function() { return this.style('italic'); };
		this.normal = function() { return this.weight('normal').variant('normal').style('normal'); };
		this.draw = function(){ this.context.font = this.toString(); };
		this.fromString = function(fs) {
			var nf = AScanvas._.fontStringParse( fs );
			for ( var i in nf ) this.setProperty(i,nf[i]);
			return this;
		}
		if ( typeof fs == 'string' ) this.fromString( fs );
		return this;
	};
}

if ( ! AScanvas.clear ) {
	AScanvas.clear = function( context,x,y ) {
		this.context = context;
		this.args = [{t:'cm',k:'translate',v:[AScanvas._.size.call(this,x),AScanvas._.size.call(this,y)]}];
		this.props = { w: this.context.canvas.width, h: this.context.canvas.height };
		this.width = function(w) {
			 this.args.push({t:'op',k:'w',v: AScanvas._.size.call(this,w)});
			 return this;
		}
		this.height = function(h) {
			 this.args.push({t:'op',k:'h',v: AScanvas._.size.call(this,h) });
			 return this;
		}
		this.size = function(w,h) {
			this.width.apply( this, [w] );
			this.height.apply( this, [typeof h == 'undefined' ? w : h] );
			return this;
		};
		this.rotate = AScanvas._.rotate;
		this.translate = AScanvas._.translate;
		this.draw = function() {
			this.context.save();
			AScanvas._.draw.apply(this,[]);
			this.context.clearRect(0,0,this.props.w,this.props.h);
			this.context.restore();
		};
		return this;
	}
}


if ( ! AScanvas.text ) {
	AScanvas.text = function( context,txt,x,y,l ) {
		this.context = context;
		this.args = [{t:'cm',k:'translate',v:[AScanvas._.size.call(this,x),AScanvas._.size.call(this,y)]}];
		this.textargs = [txt,0,0];
		if ( l ) this.textargs.push( AScanvas._.size.call(this,l) );
		this.align = AScanvas._.textAlign;
		this.border = AScanvas._.lineStyle;
		this.color = AScanvas._.fillStyle;
		this.fill = function() { this.args.push({t:'cm',k:'fillText',v:this.textargs }); return this; };
		this.font = AScanvas._.font;
		this.limit = function(l) { this.args.push({t:'om',k:'_limit',v:[AScanvas._.size.call(this,l)] }); return this; };
		this.outline = function(w,c) { return this.border(w,c).stroke().border(this.context.lineWidth,this.context.strokeStyle); };
		this.rotate = AScanvas._.rotate;
		this.shadow = AScanvas._.shadow;
		this.stroke = function() { this.args.push({t:'cm',k:'strokeText',v:this.textargs }); return this; };
		this.text = function(t) { this.args.push({t:'om',k:'_text',v:arguments }); return this; };
		this._limit = function(l) { this.textargs[3] = ( l == 0 ? undefined : parseInt(l) ); };
		this._text = function(t) { this.textargs[0] = t; };
		this.translate = AScanvas._.translate;
		this.valign = AScanvas._.textBaseline;
		return this;
	}
	AScanvas.text.prototype.draw = function(txt,x,y) {
		if ( typeof t == 'string' ) this.textargs[0] = t;
		if ( typeof x == 'number' ) this.args[0].v[0] = x; else if ( typeof x == 'string' ) this.args[0].v[0] =  AScanvas._.size.call(this,x);
		if ( typeof y == 'number' ) this.args[0].v[1] = y; else if ( typeof x == 'string' ) this.args[0].v[1] =  AScanvas._.size.call(this,y);
		this.context.save();
		AScanvas._.draw.apply(this,[]);
		this.context.restore();
	}
}

if ( ! AScanvas.line ) AScanvas.line = function( context,dashSize ) {
	this.context = context;
	this.args = [{t:'cm',k:'beginPath',v:[]}];
	this.props = { dash: 0 };
	if ( typeof dashSize == 'number' ) this.props.dash = dashSize;
	this.begin = function(x,y) { return this.from.apply(this,arguments) };
	this.color = AScanvas._.lineColor;
	this.dashes = function(d) { this.args.push({t:'op',k:'dash',v:d}); return this; };
	this.from = function(x,y) { x=AScanvas._.size.call(this,x);y=AScanvas._.size.call(this,y);this.args.push({t:'cm',k:'moveTo',v:[x,y]},{t:'op',k:'x',v:x},{t:'op',k:'y',v:y}); return this; };
	this.shadow = AScanvas._.shadow;
	this.width = AScanvas._.lineWidth;
	this.to = function(x,y,d) { this.args.push({t:'om',k:'_to',v:arguments});  return this; };
	this._to = function(x,y,dashSize) {
		x = AScanvas._.size.call(this,x);
		y = AScanvas._.size.call(this,y);
		if ( typeof dashSize == 'undefined' ) dashSize = this.props.dash;
		if ( dashSize > 0 ) {
			var x0 = this.props.x;
			var y0 = this.props.y;
			var dX = x - x0;
			var dY = y - y0;
			var dashes = Math.floor(Math.sqrt(dX * dX + dY * dY) / dashSize );
			var dashX = dX / dashes;
			var dashY = dY / dashes;
			var q = 0;
			while (q++ < dashes) {
				x0 += dashX;
				y0 += dashY;
				this.context[q % 2 == 0 ? 'moveTo' : 'lineTo'](parseInt(x0),parseInt(y0));
			}
			this.context[q % 2 == 0 ? 'moveTo' : 'lineTo'](parseInt(x),parseInt(y));
		} else {
			this.context.lineTo( parseInt(x), parseInt(y) );
		}
		this.props.x = x;
		this.props.y = y;
	};
	this.draw = function() {
		this.context.save();
		AScanvas._.draw.apply(this,[]);
		this.context.stroke();
		this.context.restore();
	};
	return this;
};

if ( ! AScanvas.softhcurve ) AScanvas.softhcurve = function( context,s ) {
	this.context = context;
	this.args = [];
	this.props = { soften: .5 };
	if ( typeof s != 'undefined' ) this.props.soften = s;
	this.begin = function() { return this.from.apply(this,arguments) };
	this.color = AScanvas._.lineColor;
	this.from = function(x,y,s) { x=AScanvas._.size.call(this,x);y=AScanvas._.size.call(this,y);this.args.push({t:'cm',k:'moveTo',v:[x,y]},{t:'op',k:'x',v:x},{t:'op',k:'y',v:y},{t:'op',k:'s',v:s}); return this; }
	this.shadow = AScanvas._.shadow;
	this.soften = function(s) { this.args.push({t:'op',k:'soften',v:s}); return this; };
	this.width = AScanvas._.lineWidth;
	this.to = function() { this.args.push({t:'om',k:'_to',v:arguments}); return this; };
	this._to = function(x,y,s) {
		x = AScanvas._.size.call(this,x);
		y = AScanvas._.size.call(this,y);
		var s0 = typeof this.props.s != 'undefined' ? this.props.s : this.props.soften;
		var s1 = typeof s != 'undefined' ? s : this.props.soften;
		var x0 = this.props.x + ( ( x - this.props.x ) * s0 );
		var x1 = x - ( ( x - this.props.x ) * s1 );
		this.context.bezierCurveTo( parseInt(x0), parseInt(this.props.y), parseInt(x1), parseInt(y), parseInt(x), parseInt(y) );
		this.props.x = x;
		this.props.y = y;
		this.props.s = s;
	};
	this.draw = function() {
		this.context.save();
		this.args.unshift({t:'cm',k:'beginPath',v:[]});
		AScanvas._.draw.apply(this,[]);
		this.context.stroke();
		this.context.restore();
	};
	return this;
}

if ( ! AScanvas.circle ) AScanvas.circle = function( context,x,y,rx,ry ) {
	this.context = context;
	x = AScanvas._.size.call(this,x);
	y = AScanvas._.size.call(this,y);
	rx = AScanvas._.size.call(this,rx);
	this.props = { r:rx };
	if ( typeof ry != 'undefined' ) this.props.ry = AScanvas._.size.call(this,ry);
	this.args = [ {t:'cm',k:'translate',v:[x,y]} ];
	this.begin = function() {
		if ( ! this.props.started ) {
			if ( this.props.ry ) AScanvas._.scale.call(this,1,this.props.ry /(this.props.r!=0?this.props.r:1) );
			this.args.push({t:'cm',k:'beginPath',v:[]});
			this.args.push({t:'cm',k:'arc',v:[0,0,rx,0,2 * Math.PI, false]});
			this.props.started = true;
		}
		return this;
	};
	this.border = AScanvas._.lineStyle;
	this.width = AScanvas._.lineWidth;
	this.color = function( c ) {
		if ( arguments[2] ) return this.gradient.apply( this, arguments );
		if ( c.indexOf('|') > 0 ) return this.gradient.apply( this, c.split('|') );
		return AScanvas._.fillStyle.call( this, c );
	};
	this.gradient = function() {
		var args = Array.prototype.slice.call(arguments);
		var a = args.splice(0,1)[0];
		this.begin.apply( this );
		if ( a == 'radial' ) {
			this.args.push({t:'cp',k:'fillStyle',v:this.context._radialGradient(0,0,this.props.r,args) });
		} else {
			a = AScanvas._.angle( a );
			var xs = this.props.r * Math.cos( a );
			var ys = this.props.r * Math.sin( a );
			this.args.push({t:'cp',k:'fillStyle',v:this.context._linearGradient(-xs,-ys,xs,ys,args) });
		}
		return this;
	};
	this.fill = function() {
		if ( arguments[0] ) this.color.apply( this, arguments );
		this.begin.apply( this );
		this.args.push({t:'cm',k:'fill',v:[] });
		return this;
	};
	this.rotate = AScanvas._.rotate;
	this.shadow = AScanvas._.shadow;
	this.stroke = function() {
		if ( arguments[0] ) this.border.apply( this, arguments );
		this.begin.apply( this );
		this.args.push({t:'cm',k:'stroke',v:[] });
		return this;
	};
	this.draw = function() {
		this.context.save();
		this.begin.apply( this );
		AScanvas._.draw.apply(this,[]);
		this.context.restore();
	};
	return this;
};

if ( ! AScanvas.vbar ) AScanvas.vbar = function( context,x,w,h ) {
	this.context = context;
	this.args = [];
	this.props = { x:AScanvas._.size.call(this,x), w:AScanvas._.size.call(this,w), h:AScanvas._.size.call(this,h), drawn: false, labelfont: AScanvas.defaults.label.font, plaintext: false };
	this.font = AScanvas._.font;
	this.label = function() { this.args.push({t:'om',k:'_label',v:arguments}); return this; };
	this.labelfont = function(f) { this.args.push({t:'op',k:'labelfont',v:f}); return this; };
	this.color = function(c) {
		if ( c.indexOf('|') > 0 ) return this.gradient.apply( this, c.split('|') );
		this.args.push({t:'op',k:'toplinecolor',v:c},{t:'op',k:'barcolor',v:c});
		return this;
	};
	this.gradient = function(c1,c2) {
		this.args.push({t:'op',k:'toplinecolor',v:c1});
		this.args.push({t:'op',k:'barcolor',v:this.context._linearGradient(this.props.x,0,this.props.x+this.props.w,0,[c1,c2,c1])});
		return this;
	};
	this._bar = function() {
		if ( this.props.drawn ) return void(0);
		var y1 = parseInt(this.context.canvas.height - this.props.h);
		if ( this.props.h > 0 ) {
			this.context.beginPath();
			if ( this.props.barcolor ) this.context.fillStyle = this.props.barcolor;
			this.context.fillRect(parseInt(this.props.x), y1, parseInt(this.props.w), parseInt(this.props.h));
			this.context.stroke();
			this.context._line().width(1).color(this.props.toplinecolor).begin(parseInt(this.props.x), y1)
				.to(parseInt(this.props.x)+parseInt(this.props.w),y1).draw();
		}
		this.props.drawn = true;
	};
	this._label = function(label,font) {
		this._bar.apply(this,[]);
		var y1 = parseInt(this.context.canvas.height - this.props.h);
		if (typeof font == 'undefined') font = this.props.labelfont;
		this.context.font =  font.toString();
		var l = this.context._text( label, parseInt(this.props.x + this.props.w/2), y1, parseInt(this.props.w -2) ).align('center');
		if ( this.props.h < 14 ) {
			l.valign('bottom').translate(0,-1);
		} else {
			l.valign('top').translate(0,1);
		}
		l.outline(AScanvas.defaults.label.borderWidth,AScanvas.defaults.label.borderColor).color(AScanvas.defaults.label.color).fill().draw();
	};
	this.draw = function() {
		this.context.save();
		this.args.push({t:'om',k:'_bar',v:[]});
		AScanvas._.draw.apply(this,[]);
		this.context.restore();
	};
	return this;
};

if ( ! AScanvas.hbar ) AScanvas.hbar = function( context,y,h,w ) {
	this.context = context;
	this.args = [];
	this.props = { y:AScanvas._.size.call(this,y), h:AScanvas._.size.call(this,h), w:AScanvas._.size.call(this,w), drawn: false, xoff:0, labelfont: AScanvas.defaults.label.font, plaintext: false };
	this.font = AScanvas._.font;
	this.label = function() { this.props.label = arguments[0]; this.args.push({t:'om',k:'_label',v:arguments}); return this; };
	this.labelfont = function(f) { this.args.push({t:'op',k:'labelfont',v:f}); return this; };
	this.xoffset = function(x) { this.args.push({t:'op',k:'xoff',v:AScanvas._.size.call(this,x)}); return this; };
	this.text = function() { this.props.text = arguments[0]; this.args.push({t:'om',k:'_text',v:arguments}); return this; };
	this.color = function(c) {
		if ( c.indexOf('|') > 0 ) return this.gradient.apply( this, c.split('|') );
		this.args.push({t:'op',k:'toplinecolor',v:c},{t:'op',k:'barcolor',v:c});
		return this;
	};
	this.gradient = function(c1,c2) {
		this.args.push({t:'op',k:'toplinecolor',v:c1});
		this.args.push({t:'op',k:'barcolor',v:this.context._linearGradient(0,this.props.y,0,this.props.y+this.props.h,[c1,c2,c1])});
		return this;
	};
	this.plaintext = function(flag) { this.props.plaintext = !! flag; return this; };
	this._bar = function() {
		if ( this.props.drawn ) return void(0);
		if ( this.props.w > 0 ) {
			var x1 = parseInt(this.props.xoff + this.props.w);
			this.context.beginPath();
			if ( this.props.barcolor ) this.context.fillStyle = this.props.barcolor;
			this.context.fillRect(parseInt(this.props.xoff), parseInt(this.props.y), x1, parseInt(this.props.h));
			this.context.stroke();
			this.context._line().width(1).color(this.props.toplinecolor).begin(x1,parseInt(this.props.y))
				.to(x1,parseInt(this.props.y)+parseInt(this.props.h)).draw();
		}
		if ( this.props.plaintext ) {
			var c = this.context.canvas;
			if ( c.getElementsByTagName('p').length == 0 ) c.innerHTML = '';
			var s = ( this.props.text ? this.props.text + ': ' : '') + ( this.props.label ? this.props.label : '' );
			if ( s !== '' ) c.innerHTML = c.innerHTML + '<p>' + s + '</p>';
		}
		this.props.drawn = true;
	};
	this._label = function( label, font ) {
		this._bar.apply(this,[]);
		var x1 = parseInt(this.props.xoff + this.props.w);
		var mid = parseInt(this.props.y + this.props.h/2);
		this.context.save();
		if (typeof font == 'undefined') font = this.props.labelfont;
		this.context.font =  font.toString();
		var tw = this.context.measureText(label).width + 3;
		var l = this.context._text( label, x1, mid ).valign('middle');
		if ( this.props.w > tw ) {
			l.translate(-3,0).limit( parseInt(this.props.w -3) ).align('right');
		} else {
			l.translate(3,0).align('left');
		}
		l.outline(AScanvas.defaults.label.borderWidth,AScanvas.defaults.label.borderColor).color(AScanvas.defaults.label.color).fill().draw();
		this.context.restore();
	};
	this._text = function( t, font ) {
		var x1 = parseInt(this.props.xoff + this.props.w);
		var mid = parseInt(this.props.y + this.props.h/2);
		if (typeof font != 'undefined') this.context.font = font; else if ( this.props.textfont ) this.context.font = this.props.textfont;
		this.context._text( t, this.context.canvas.width -4, mid, this.context.canvas.width - parseInt(x1 +6) )
			.color( this.props.toplinecolor ).align('right').valign('middle').shadow(2).fill().draw();
	};
	this.draw = function() {
		this.context.save();
		this.args.push({t:'om',k:'_bar',v:[]});
		AScanvas._.draw.apply(this,[]);
		this.context.restore();
	};
	return this;
};

/* Context macros, will start with "__" */

if ( ! AScanvas.macro ) AScanvas.macro = {};

if ( ! AScanvas.macro.clear ) {
	AScanvas.macro.clear = function( x0,y0,x1,y1 ) {
		x0 = typeof x0 == 'undefined' ? 0 : AScanvas._.size.apply( this, [ x0 ] );
		y0 = typeof y0 == 'undefined' ? 0 : AScanvas._.size.apply( this, [ y0 ] );
		x1 = typeof x1 == 'undefined' ? this.canvas.width : AScanvas._.size.apply( this, [ x1 ] );
		y1 = typeof y1 == 'undefined' ? this.canvas.height : AScanvas._.size.apply( this, [ y1 ] );
		this.clearRect.apply( this, [x0,y0,x1,y1] );
	}
}

if ( ! AScanvas.macro.line ) {
	AScanvas.macro.line = function( context,dashSize ) {
		this.line = new AScanvas.line( context );
		if ( dashSize ) this.line.dashes( dashSize );
		return this;
	}
	AScanvas.macro.line.prototype.to = function(points) {
		this.line.begin.apply(this.line,points[0]);
		for ( var i = 1; i < points.length; i++ ) this.line.to.apply(this.line,points[i]);
		this.line.draw.apply( this.line );
		return this;
	}
}

if ( ! AScanvas.macro.softhcurve ) {
	AScanvas.macro.softhcurve = function( context,s ) {
		this.softhcurve = new AScanvas.softhcurve( context,s );
		return this;
	}
	AScanvas.macro.softhcurve.prototype.to = function(points) {
		this.softhcurve.begin.apply(this.softhcurve,points[0]);
		for ( var i = 1; i < points.length; i++ ) this.softhcurve.to.apply(this.softhcurve,points[i]);
		this.softhcurve.draw.apply( this.softhcurve );
		return this;
	}
}

if ( ! AScanvas.macro.circle ) {
	AScanvas.macro.circle = function( context, r ) {
		this.context = context;
		this.r = AScanvas._.size(r,context);
		this.angle = 2 * Math.PI, false;
	}
	AScanvas.macro.circle.prototype.to = function(points) {
		for ( var i = 0; i < points.length; i++ ) {
			var r = typeof points[i][2] != 'undefined' ? AScanvas._.size(points[i][2],context) : this.r;
			this.context.beginPath();
			this.context.arc(AScanvas._.size(points[i][0],context), AScanvas._.size(points[i][1],context), r, 0, this.angle, false);
			this.context.stroke();
		}
		return this;
	}
}

if ( ! AScanvas.macro.reset ) AScanvas.macro.reset = function() {
	AScanvas.macro.clear.call(this);
	AScanvas.macro.title.reset.call(this);
	AScanvas.macro.click.reset.call(this);
};

if ( ! AScanvas.macro.title ) {
	AScanvas.macro.title = {
		'set': function(t){ this.canvas.title = t; },
		reset: function() { if ( this.canvas._titles ) this.canvas._titles = []; },
	};
	// this will be triggered for event e, in the context of the canvas:
	AScanvas.macro.title.mousemoveFunc = function(e) {
		if ( this._titles[0] ) {
			var x = e.offsetX ? e.offsetX : ( e.clientX - this.offsetLeft );
			var y = e.offsetY ? e.offsetY : ( e.clientY - this.offsetTop );
			var t = false;
			for ( var i = 0; i < this._titles.length; i++ ) {
				var p = this._titles[i];
				if ( x >= p[0] ) if ( x <= p[2] ) if ( y >= p[1] ) if ( y <= p[3] ) {
					t = p[4];
					break;
				}
			}
			this.title=t?t:undefined;
		} else {
			this.title=undefined;
		}
	};
	AScanvas.macro.title.add = function() {
		if ( ! this.canvas._titles ) {
			this.canvas._titles = [];
			this.canvas.addEventListener( 'mousemove', AScanvas.macro.title.mousemoveFunc, false );
		}
		for ( var i = 0; i < 4; i++ ) arguments[i] = AScanvas._.size.call( this.canvas, arguments[i] );
		this.canvas._titles.push(arguments);
	};
}

if ( ! AScanvas.macro.click ) {
	AScanvas.macro.click = { reset: function() { if ( this.canvas._clicks ) this.canvas._clicks = []; } };
	// this will be triggered for event e, in the context of the canvas:
	AScanvas.macro.click.mousemoveFunc = function(e){
		if ( this._clicks[0] ) {
			var x = e.offsetX ? e.offsetX : ( e.clientX - this.offsetLeft );
			var y = e.offsetY ? e.offsetY : ( e.clientY - this.offsetTop );
			var t = false;
			for ( var i = 0; i < this._clicks.length; i++ ) {
				var p = this._clicks[i];
				if ( x >= p[0] ) if ( x <= p[2] ) if ( y >= p[1] ) if ( y <= p[3] ) {
					t = p[4];
					break;
				}
			}
			this.style.cursor = t ? 'pointer' : 'default';
		} else {
			this.style.cursor = 'default';
		}
	};
	AScanvas.macro.click.clickFunc = function(e){
		if ( this._clicks[0] ) {
			var x = e.offsetX ? e.offsetX : ( e.clientX - this.offsetLeft );
			var y = e.offsetY ? e.offsetY : ( e.clientY - this.offsetTop );
			var t = false;
			for ( var i = 0; i < this._clicks.length; i++ ) {
				var p = this._clicks[i];
				if ( x >= p[0] ) if ( x <= p[2] ) if ( y >= p[1] ) if ( y <= p[3] ) {
					t = p[4];
					break;
				}
			}
			switch ( typeof t ) {
				case 'string'	: eval(t); break;
				case 'function'	: t.apply(this.document); break;
			}
		}
	};
	AScanvas.macro.click.add = function() {
		if ( ! this.canvas._clicks ) {
			this.canvas._clicks = [];
			this.canvas.addEventListener('mousemove',AScanvas.macro.click.mousemoveFunc,false);
			this.canvas.addEventListener('click',AScanvas.macro.click.clickFunc,false);
		}
		for ( var i = 0; i < 4; i++ ) arguments[i] = AScanvas._.size.call( this.canvas, arguments[i] );
		this.canvas._clicks.push(arguments);
	};
}

if ( ! AScanvas.macro.xgrid ) AScanvas.macro.xgrid = function( s,d,c ) {
	var w = this.canvas.width;
	var h = this.canvas.height;
	var ss = w / s;
	this.save();
	this.strokeStyle = c ? c : 'white';
	for ( var i = 1; i < s; i++ ) this.__line(d ? d : 4).to([[parseInt(ss*i),0],[parseInt(ss*i),h]]);
	this.restore();
}

if ( ! AScanvas.macro.ygrid ) AScanvas.macro.ygrid = function( s,d,c ) {
	var w = this.canvas.width;
	var h = this.canvas.height;
	var ss = h / s;
	this.save();
	this.strokeStyle = c ? c : 'white';
	for ( var i = 1; i < s; i++ ) this.__line(d ? d : 4).to([[0,parseInt(ss*i)],[w,parseInt(ss*i)]]);
	this.restore();
}

/* Add methods to prototype */

if ( ! CanvasGradient.prototype._addCS ) CanvasGradient.prototype._addCS = function( s, c ) { this.addColorStop( s, c); return this; };

if ( ! CanvasRenderingContext2D.prototype._linearGradient ) CanvasRenderingContext2D.prototype._linearGradient = function(x0,y0,x1,y1,cv) {
	var g = this.createLinearGradient(parseInt(x0),parseInt(y0),parseInt(x1),parseInt(y1));
	if ( Array.isArray( cv ) ) {
		var steps = cv.length -1;
		for ( var i = 0; i <= steps; i++ ) g.addColorStop( i/steps, cv[i] );
	}
	return g;
}

if ( ! CanvasRenderingContext2D.prototype._radialGradient ) CanvasRenderingContext2D.prototype._radialGradient = function(x0,y0,r,cv) {
	x0 = parseFloat( x0 );
	y0 = parseFloat( y0 );
	r = parseFloat( r );
	var g = this.createRadialGradient(Math.round(x0),Math.round(y0),5,Math.round(x0),Math.round(y0),Math.round(r *2));
	if ( Array.isArray( cv ) ) {
		var steps = cv.length -1;
		for ( var i = 0; i <= steps; i++ ) g.addColorStop( i/steps, cv[i] );
	}
	return g;
}

if ( ! CanvasRenderingContext2D.prototype._clear )	CanvasRenderingContext2D.prototype._clear = function(x,y) { return new AScanvas.clear( this, x,y ); };
if ( ! CanvasRenderingContext2D.prototype._vbar )	CanvasRenderingContext2D.prototype._vbar = function(x,w,h) { return new AScanvas.vbar( this, x,w,h ); };
if ( ! CanvasRenderingContext2D.prototype._hbar )	CanvasRenderingContext2D.prototype._hbar = function(y,h,w) { return new AScanvas.hbar( this,y,h,w ); };
if ( ! CanvasRenderingContext2D.prototype._circle )	CanvasRenderingContext2D.prototype._circle = function(x,y,rx,ry) { return new AScanvas.circle( this,x,y,rx,ry ); };
if ( ! CanvasRenderingContext2D.prototype.__circles )	CanvasRenderingContext2D.prototype.__circles = function(radius) { return new AScanvas.macro.circle( this, radius ); };
if ( ! CanvasRenderingContext2D.prototype._line )	CanvasRenderingContext2D.prototype._line = function(dashSize) { return new AScanvas.line( this, dashSize ); };
if ( ! CanvasRenderingContext2D.prototype._font )	CanvasRenderingContext2D.prototype._font = function(fs) { return new AScanvas.font( this,fs ); };
if ( ! CanvasRenderingContext2D.prototype._text )	CanvasRenderingContext2D.prototype._text = function(txt,x,y,l) { return new AScanvas.text( this,txt,x,y,l ); };
if ( ! CanvasRenderingContext2D.prototype.__line )	CanvasRenderingContext2D.prototype.__line = function(dashSize) { return new AScanvas.macro.line( this, dashSize ); };
if ( ! CanvasRenderingContext2D.prototype._softhcurve )	CanvasRenderingContext2D.prototype._softhcurve = function(s) { return new AScanvas.softhcurve( this,s ); };
if ( ! CanvasRenderingContext2D.prototype.__softhcurve)	CanvasRenderingContext2D.prototype.__softhcurve = function(s) { return new AScanvas.macro.softhcurve( this,s ); };
if ( ! CanvasRenderingContext2D.prototype.__addClick )	CanvasRenderingContext2D.prototype.__addClick = AScanvas.macro.click.add;
if ( ! CanvasRenderingContext2D.prototype.__addTitle )	CanvasRenderingContext2D.prototype.__addTitle = AScanvas.macro.title.add;
if ( ! CanvasRenderingContext2D.prototype.__clear )	CanvasRenderingContext2D.prototype.__clear = AScanvas.macro.clear;
if ( ! CanvasRenderingContext2D.prototype.__reset )	CanvasRenderingContext2D.prototype.__reset = AScanvas.macro.reset;
if ( ! CanvasRenderingContext2D.prototype.__xgrid )	CanvasRenderingContext2D.prototype.__xgrid = AScanvas.macro.xgrid;
if ( ! CanvasRenderingContext2D.prototype.__ygrid )	CanvasRenderingContext2D.prototype.__ygrid = AScanvas.macro.ygrid;
