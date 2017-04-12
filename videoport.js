"use strict";

let videoAddressPrefix = 'https://aws-website-videonuclearpixelcom-tgl8t.s3.amazonaws.com/content/';
let mixinAddresses = {
	methods: {
		thumbUrl: function(video){
			return `${videoAddressPrefix}${video.name}.jpg`;
		},
		videoUrl: function(video){
			return `${videoAddressPrefix}${video.name}-1920x1080-yuv420p-20000.hevc`;
		}
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
				started: false,
				playing: false,
				isFullscreen: false,
				loaded: 0,
				decoded: 0,
				ready: false,
				statusMessage: ''
			}
		},
		props: {
			video: Object
		},
		mounted: function() {
			let t = this;
			this.videoport = new Videoport(t.video, t, t.$refs.canvas);
		},
		beforeMount: function () {
			document.addEventListener('resize', resizeWindowEventHandler);
			document.addEventListener('fullscreenchange', resizeWindowEventHandler);
			window.addEventListener('resize', resizeWindowEventHandler);
		},
		beforeDestroy: function () {
			this.videoport.die();
			document.removeEventListener('resize', resizeWindowEventHandler);
			document.removeEventListener('fullscreenchange', resizeWindowEventHandler);
			window.removeEventListener('resize', resizeWindowEventHandler);
		},
		methods: {
			playToggle: function(event){
				let v = this;
				v.started = true;
				v.playing = !v.playing;
				v.videoport.setPlay(v.playing);
			},
			fullscreenToggle: function(){
				console.log(this.isFullscreen);
				if (!document.fullscreenElement) {
					this.isFullscreen = true;
					this.$el.requestFullscreen();
				} else {
					if (document.exitFullscreen) {
						this.isFullscreen = false;
						document.exitFullscreen();
					}
				}
			}
		},
		template: `
			<div class="videoport noSelect">
				<canvas
					ref="canvas"
					:width="width"
					:height="height"
					/>
				<div class="overlay" @click="playToggle">
					<transition-group name="fade">
						<img key="a" v-if="!decoded" :src="thumbUrl(video)" />
						<div key="b" v-if="!ready" class="statusMessage">{{statusMessage}} - Loaded: {{loaded.toFixed(2)}} - Decoded: {{decoded.toFixed(2)}}</div>
						<video-status-icon key="c" v-if="!ready && started" type="loading" class="rotating" />
						<video-status-icon key="d" v-if="!started || !playing && ready" type="play" />
					</transition-group>
				</div>
				<div @click="fullscreenToggle">
					<video-status-icon class="fullscreen" key="off" v-if="!isFullscreen" type="fullscreen" />
					<video-status-icon class="fullscreen" key="on"  v-if="isFullscreen" type="fullscreenExit" />
				</div>
			</div>
		`
	}
);

let statusShapes = {
	play: "M112,64A48,48,0,1,1,64,16,48,48,0,0,1,112,64ZM48,43.21539V84.78461a4,4,0,0,0,6,3.4641L90,67.4641a4,4,0,0,0,0-6.9282L54,39.75129A4,4,0,0,0,48,43.21539Z",
	pause: "M52,112H28a4,4,0,0,1-4-4V20a4,4,0,0,1,4-4H52a4,4,0,0,1,4,4v88A4,4,0,0,1,52,112Zm48-96H76a4,4,0,0,0-4,4v88a4,4,0,0,0,4,4h24a4,4,0,0,0,4-4V20A4,4,0,0,0,100,16Z",
	loading: "M100,64A36.00074,36.00074,0,1,0,63.793,99.99942a4.12438,4.12438,0,0,0,4.19154-3.6437A4.00059,4.00059,0,0,0,64,92,28.00073,28.00073,0,1,1,92,64H84.82843a2,2,0,0,0-1.41421,3.41421L94.58579,78.58579a2,2,0,0,0,2.82843,0l11.17157-11.17157A2,2,0,0,0,107.17157,64Z",
	fullscreen: "M108,16H20a4,4,0,0,0-4,4v88a4,4,0,0,0,4,4h88a4,4,0,0,0,4-4V20A4,4,0,0,0,108,16ZM57.31372,76.34314,42.82843,90.82843l5.75739,5.75732A2,2,0,0,1,47.17157,100H30a2,2,0,0,1-2-2V80.82843a2,2,0,0,1,3.41418-1.41425l5.75739,5.75739L51.65686,70.68628a4,4,0,1,1,5.65686,5.65686Zm0-19.02948v.00006a4.00005,4.00005,0,0,1-5.65686,0L37.17157,42.82843l-5.75739,5.75732A2,2,0,0,1,28,47.17157V30a2,2,0,0,1,2-2H47.17157a2,2,0,0,1,1.41425,3.41418l-5.75739,5.75739L57.31372,51.65686A4,4,0,0,1,57.31372,57.31366ZM100,98a2,2,0,0,1-2,2H80.82843a2,2,0,0,1-1.41425-3.41425l5.75739-5.75732L70.68628,76.34314a4,4,0,1,1,5.65686-5.65686L90.82843,85.17157l5.75739-5.75739A2,2,0,0,1,100,80.82843Zm0-50.82843a2,2,0,0,1-3.41418,1.41418l-5.75739-5.75732L76.34314,57.31372a4.00005,4.00005,0,0,1-5.65686,0v-.00006a4,4,0,0,1,0-5.6568L85.17157,37.17157l-5.75739-5.75739A2,2,0,0,1,80.82843,28H98a2,2,0,0,1,2,2Z",
	fullscreenExit: "M108,16H20a4,4,0,0,0-4,4v88a4,4,0,0,0,4,4h88a4,4,0,0,0,4-4V20A4,4,0,0,0,108,16ZM60,87.17157a2,2,0,0,1-3.41418,1.41418l-5.75739-5.75732L40.34314,93.31372a4.00005,4.00005,0,0,1-5.65686,0v-.00006a4,4,0,0,1,0-5.6568L45.17157,77.17157l-5.75739-5.75739A2,2,0,0,1,40.82843,68H58a2,2,0,0,1,2,2ZM60,58a2,2,0,0,1-2,2H40.82843a2,2,0,0,1-1.41425-3.41425l5.75739-5.75732L34.68628,40.34314a4,4,0,0,1,5.65686-5.65686L50.82843,45.17157l5.75739-5.75739A2,2,0,0,1,60,40.82843ZM93.31372,93.31372a4.00005,4.00005,0,0,1-5.65686,0L77.17157,82.82843l-5.75739,5.75732A2,2,0,0,1,68,87.17157V70a2,2,0,0,1,2-2H87.17157a2,2,0,0,1,1.41425,3.41418l-5.75739,5.75739L93.31372,87.65686A4.00005,4.00005,0,0,1,93.31372,93.31372Zm0-52.97058L82.82843,50.82843l5.75739,5.75732A2,2,0,0,1,87.17157,60H70a2,2,0,0,1-2-2V40.82843a2,2,0,0,1,3.41418-1.41425l5.75739,5.75739L87.65686,34.68628a4,4,0,1,1,5.65686,5.65686Z"
};
Vue.component(
	'video-status-icon',
	{
		props: {
			type: String
		},
		methods: {
			getShape: function(){
				let result = statusShapes[this.type];
				if(!result){
					console.error('Bad shape: ' + this.type);
				}
				return result;
			}
		},
		template: `
			<svg class="video-status-icon" viewBox="0 0 128 128">
				<path :d="getShape(type)" />
			</svg>
		`
	}
);

let arrayRemove = function(array, item){
	let index = array.indexOf(item);
	if(index !== -1){
		array.splice(index, 1);
	}
	return array;
};

let videoportList = [];

let Videoport = function(video, vue, canvas){
	let p = this;
	p.video = video;
	p.vue = vue;
	p.canvas = canvas;
	p.context = canvas.getContext('2d');
	p.shouldPlay = false;
	p.ready = false;
	p.playOffset = 0;
	p.sizeWindow();
	p.sourceBuffer = decodedFrameBufferMap[p.video.name] || new DecodedFrameBuffer(p.video);
	p.sourceBuffer.addVideoport(p);

	videoportList.push(p);
};

Videoport.prototype = {
	fps: 24,
	die: function(){
		this.sourceBuffer.removeVideoport(this);
		arrayRemove(videoportList, this);
	},
	setPlay: function(shouldPlay){
		this.shouldPlay = shouldPlay;
		this.sourceBuffer.load();
	},
	render: function (time) {
		let p = this;
		if(p.shouldPlay && p.ready){
			let delta = time - (p.lastTimeSample || 0);
			p.playOffset += delta;
			p.setFrameByTime(p.playOffset);
		}
		p.lastTimeSample = time;
	},
	setFrameByTime: function(time){
		let p = this;
		let frames = p.sourceBuffer.frameCount;
		let currentFrame = Math.floor(time / 1000 / (frames / p.fps) * frames) % frames;
		if(currentFrame !== p.prevFrame){
			let sourceImage = p.sourceBuffer.canvasList[currentFrame];
			p.context.drawImage(sourceImage, 0, 0, p.width, p.height);
			p.prevFrame = currentFrame;
		}
	},
	sizeWindow: function () {
		let p = this;
		let ratio = window['devicePixelRatio'] || 1;
		p.width = p.canvas.clientWidth * ratio;
		p.height = p.canvas.clientHeight * ratio;
		p.vue.width = p.width;
		p.vue.height = p.height;
	},
	handleBufferUpdate: function(){
		let p = this;
		let b = p.sourceBuffer;
		let vue = p.vue;
		vue.statusMessage = b.status;
		vue.loaded = b.loaded;
		vue.decoded = b.decoded;
		vue.ready = b.ready;
		p.ready = b.ready;
		let imageIndex = b.ready ? 0 : b.canvasList.length - 1;
		let image = b.canvasList[imageIndex];
		if(image){
			//I guess you can't render to a context the instant it's created?
			requestAnimationFrame(function(){
				p.context.drawImage(image, 0, 0, p.width, p.height);
			});
		}
	}
};

let decodedFrameBufferMap = {};

let DecodedFrameBuffer = function(video){
	let b = this;
	b.videoAddress = mixinAddresses.methods.videoUrl(video);
	b.frameCount = parseInt(video.name.split('-').pop(), 10);
	b.started = false;
	b.totalSize = 0;
	b.loaded = 0;
	b.decoded = 0;
	b.ready = false;
	b.status = 'Not loaded';
	b.canvasList = [];
	b.videoportList = [];
	b.decoder = new libde265.RawPlayer(document.createElement('canvas'));
	b.decoder.addFrameBuffer(b);
	b.getTotalSize();
	decodedFrameBufferMap[video.name] = b;
};

DecodedFrameBuffer.prototype = {
	addVideoport: function(p){
		this.videoportList.push(p);
		this.updateVideoports();
	},
	removeVideoport: function(p){
		arrayRemove(this.videoportList, p);
	},
	updateVideoports: function () {
		let b = this;
		b.videoportList.forEach(function(p){
			p.handleBufferUpdate();
		});
	},
	getTotalSize: function(){
		let b = this;
		let sizeRequest = new XMLHttpRequest();
		sizeRequest.open("head", b.videoAddress, true);
		sizeRequest.onload = function(event){
			b.totalSize = parseInt(event.total, 10);
		};
		sizeRequest.send();
	},
	load: function () {
		let b = this;
		if(!b.started){
			b.status = 'Loading';
			b.started = true;
			b.decoder.startLoad(b.videoAddress);
			this.updateVideoports();
		}
	},
	handleDecoderLoadStart: function(){
		this.status = 'Loading started';
		this.updateVideoports();
	},
	handleDecoderLoadProgress: function(loadingProgressEvent){
		let loaded = Math.floor(loadingProgressEvent.loaded / 1024);
		let total = Math.floor(this.totalSize / 1024);
		this.status = `Loading ${loaded} / ${total || '??'} KB`;
		this.loaded = loaded / total;
		this.updateVideoports();
	},
	handleDecoderDecodeStart: function(){
		this.status = 'Decoding started';
		this.loaded = 1;
		this.updateVideoports();
	},
	handleDecoderFrame: function(frameCanvas){
		let b = this;
		let framesLoaded = b.canvasList.push(frameCanvas);
		b.decoded = framesLoaded / b.frameCount;
		b.lastStoredFrame = frameCanvas;
		b.status = `Decoded ${framesLoaded} / ${b.frameCount} frames`;
		if(b.decoded === 1){
			this.status = `Ready; Loaded & Decoded`;
			this.ready = true;
			this.decoder = null;
		}
		this.updateVideoports();
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

libde265.RawPlayer.prototype._display_image = function(libde265Image){
	let decoder = this;
	let decodedFrameBuffer = decoder.decodedFrameBuffer;
	let bufferCanvas = document.createElement('canvas');
	let bufferContext = bufferCanvas.getContext('2d');
	let w = libde265Image.get_width();
	let h = libde265Image.get_height();
	bufferCanvas.width = w;
	bufferCanvas.height = h;
	bufferContext.fillStyle = '#000';
	bufferContext.fillRect(0,0,w,h);
	decoder.image_data = bufferContext.createImageData(w, h);
	libde265Image.display(decoder.image_data, function(display_image_data) {
		bufferContext.putImageData(display_image_data, 0, 0);
		decodedFrameBuffer.handleDecoderFrame(bufferCanvas);
	});
};

libde265.RawPlayer.prototype.handlerMap = {
	loading: 'LoadStart',
	loadProgress: 'LoadProgress',
	initializing: 'DecodeStart'
};

libde265.RawPlayer.prototype.addFrameBuffer = function(decodedFrameBuffer){
	let decoder = this;
	decoder.decodedFrameBuffer = decodedFrameBuffer;
	decoder.set_status_callback(function(msg, extra) {
		let handler = decoder.handlerMap[msg];
		if (handler) {
			decodedFrameBuffer['handleDecoder' + handler](extra);
		}
	});
};

libde265.RawPlayer.prototype.startLoad = function(url) {
	let decoder = this;
	let request = new XMLHttpRequest();
	decoder._reset();
	request.open("get", url, true);
	request.responseType = "arraybuffer";
	request.onprogress = function(event) {
		decoder._set_status("loadProgress", event);
	};
	request.onload = function(event) {
		decoder._handle_onload(request, event);
	};
	decoder._set_status("loading");
	decoder.running = true;
	request.send();
};
