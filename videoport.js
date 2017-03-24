"use strict";

let mixinAddresses = {
	methods: {
		thumbUrl: function(video){
			return `http://root.nuclearpixel.com/video_portfolio_content/${video.name}.jpg`;
		},
		videoUrl: function(video){
			return `http://root.nuclearpixel.com/video_portfolio_content/${video.name}-1920x1080-yuv420p-20000.hevc`;
		},
	}
};

Vue.component(
	'videoport',
	{
		mixins: [mixinAddresses],
		data: function() {
			return {
				width: 0,
				height: 0,
				go: false,
				loading: false,
				loaded: false,
				statusMessage: ''
			}
		},
		props: {
			video: Object
		},
		mounted: function() {
			let t = this;
			let videoport = videoportMap[t.video.name] || new Videoport(t.video);
			videoport.attachVue(t, t.$refs.canvas);
			this.videoport = videoport;
		},
		beforeMount: function () {
			document.addEventListener('resize', resizeWindowEventHandler);
			window.addEventListener('resize', resizeWindowEventHandler);
		},
		beforeDestroy: function () {
			this.videoport.removeVue();
			document.removeEventListener('resize', resizeWindowEventHandler);
			window.removeEventListener('resize', resizeWindowEventHandler);
		},
		methods: {
			toggle: function(event){
				this.go = !this.go;
				this.videoport.toggle(this.go);
			}
		},
		computed: {
			symbolState: function () {
				let t = this;
				let symbol = 'play';
				if(t.go){
					symbol = 'pause';
				} else if(t.loading) {
					symbol = 'loading';
				}
				return symbol;
			}
		},
		template: `
			<div class="videoport noSelect">
				<canvas
					ref="canvas"
					:width="width"
					:height="height"
					/>
				<div v-if="!loaded" class="overlay" @click="toggle">
					<img v-if="!go" :src="thumbUrl(video)" />
					<div class="statusMessage">{{statusMessage}}</div>
					<video-status-icon :type="symbolState" />
				</div>
			</div>
		`
	}
);

Vue.component(
	'video-status-icon',
	{
		props: {
			type: String
		},
		created: function () {
			this.shapes = {
				play: "M112,64A48,48,0,1,1,64,16,48,48,0,0,1,112,64ZM48,43.21539V84.78461a4,4,0,0,0,6,3.4641L90,67.4641a4,4,0,0,0,0-6.9282L54,39.75129A4,4,0,0,0,48,43.21539Z",
				pause: "M52,112H28a4,4,0,0,1-4-4V20a4,4,0,0,1,4-4H52a4,4,0,0,1,4,4v88A4,4,0,0,1,52,112Zm48-96H76a4,4,0,0,0-4,4v88a4,4,0,0,0,4,4h24a4,4,0,0,0,4-4V20A4,4,0,0,0,100,16Z",
				loading: "M100,64A36.00074,36.00074,0,1,0,63.793,99.99942a4.12438,4.12438,0,0,0,4.19154-3.6437A4.00059,4.00059,0,0,0,64,92,28.00073,28.00073,0,1,1,92,64H84.82843a2,2,0,0,0-1.41421,3.41421L94.58579,78.58579a2,2,0,0,0,2.82843,0l11.17157-11.17157A2,2,0,0,0,107.17157,64Z"
			};
		},
		template: `
			<svg class="video-status-icon" viewBox="0 0 128 128">
				<path :d="shapes[type]" />
			</svg>
		`
	}
);

let videoportMap = {};
let videoportList = [];

let Videoport = function(video){
	let p = this;
	p.video = video;
	p.url = mixinAddresses.methods.videoUrl(video);
	p.loaded = false;
	p.loading = false;
	p.shouldPlay = false;
	p.bufferCanvasList = [];
	p.width = 0;
	p.height = 0;

	p.player = new libde265.RawPlayer(document.createElement('canvas'));
	p.player.set_status_callback(function(msg, fps) {
		if (msg !== 'fps') {
			p.vue.statusMessage = msg;
		}
	});
	p.player.addVideoPort(p);
	videoportMap[video.name] = p;
};

Videoport.prototype = {
	attachVue: function(vue, canvas){
		let p = this;
		p.vue = vue;
		p.canvas = canvas;
		p.context = canvas.getContext('2d');
		videoportList.push(p);

		p.vue.loaded = p.loaded;
		p.vue.loading = p.loading;
		p.sizeWindow();
	},
	removeVue: function(){
		let p = this;
		p.vue = undefined;
		p.canvas = undefined;
		p.context = undefined;
		let index = videoportList.indexOf(p);
		if(index !== -1){
			videoportList.splice(index, 1);
		}
	},
	toggle: function(go){
		this.shouldPlay = go;
		this.load();
	},
	load: function () {
		let p = this;
		if(!p.loaded || !p.loading){
			p.player.playback(p.url);
		}
	},
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

let hevcImageInterceptor = function(libde265Image){
	let player = this;
	let videoport = player.videoport;
	let bufferCanvas = document.createElement('canvas');
	let bufferContext = bufferCanvas.getContext('2d');
	let w = libde265Image.get_width();
	let h = libde265Image.get_height();
	if (w !== bufferCanvas.width || h !== bufferCanvas.height || !player.image_data) {
		bufferCanvas.width = w;
		bufferCanvas.height = h;
		bufferContext.fillStyle = '#000';
		bufferContext.fillRect(0,0,w,h);
		player.image_data = bufferContext.createImageData(w, h);
	}
	libde265Image.display(player.image_data, function(display_image_data) {
		bufferContext.putImageData(display_image_data, 0, 0);
		videoport.bufferCanvasList.push(bufferCanvas);
		videoport.context.drawImage(bufferCanvas, 0, 0);
		if(!player.running){
			videoport.loaded = true;
		}
	});
};
libde265.RawPlayer.prototype.addVideoPort = function(videoport){
	this.videoport = videoport;
};
libde265.RawPlayer.prototype._display_image = hevcImageInterceptor;
