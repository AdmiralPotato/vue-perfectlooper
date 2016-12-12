Vue.component(
	'videoport',
	{
		data: function() {
			return {
				width: 0,
				height: 0
			}
		},
		props: {
			video: Object
		},
		mounted: function() {
			let t = this;
			this.videoport = new Videoport(this.$el, this);
		},
		beforeMount: function () {
			document.addEventListener('resize', resizeWindowEventHandler);
			window.addEventListener('resize', resizeWindowEventHandler);
		},
		beforeDestroy: function () {
			document.removeEventListener('resize', resizeWindowEventHandler);
			window.removeEventListener('resize', resizeWindowEventHandler);
		},
		template: `<canvas
			class="videoport"
			:width="width"
			:height="height"
			/>`
	}
);

let videoportList = [];

let Videoport = function(canvas, vue){
	let p = this;
	p.canvas = canvas;
	p.vue = vue;
	p.width = 0;
	p.height = 0;
	p.sizeWindow();
	videoportList.push(p);
	window.videoport = p;
};

Videoport.prototype = {
	render: function () {
		//TODO: anything at all here
	},
	sizeWindow: function () {
		let p = this;
		let ratio = window.devicePixelRatio || 1;
		p.width = p.canvas.clientWidth * ratio;
		p.height = p.canvas.clientHeight * ratio;
		p.vue.width = p.width;
		p.vue.height = p.height;
	},
};

let resizeWindowEventHandler = function () {
		videoportList.forEach(function (item) {
			item.sizeWindow();
		});
	},
	renderAllViews = function (time) {
		videoportList.forEach(function (item) {
			item.render(time);
		});
	};

let go = true,
	start = function(){
		go = true;
		requestAnimationFrame(render);
	},
	stop = function(){
		go = false;
	};

let render = function (time){
	if(go){
		requestAnimationFrame(render);
	}
	renderAllViews(time);
};

start();
