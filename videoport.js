"use strict";

let videoAddressPrefix = 'https://aws-website-videonuclearpixelcom-tgl8t.s3.amazonaws.com/content/';

let qualitySuffixes = [
	'960x540',
	'1920x1080',
];
let screenHasHdManyPixels = (Math.max(screen.width, screen.height) * window.devicePixelRatio) > 960;
let defaultQuality = screenHasHdManyPixels ? 1 : 0;
let mixinAddresses = {
	methods: {
		thumbUrl: function(video){
			return `${videoAddressPrefix}${video.name}-thumb.jpg`;
		},
		previewUrl: function(video){
			return `${videoAddressPrefix}${video.name}-preview.jpg`;
		},
		videoUrl: function(video){
			return `${videoAddressPrefix}${video.name}-${qualitySuffixes[defaultQuality]}`;
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
				activityHalted: true,
				loaded: 0,
				decoded: 0,
				scaled: 0,
				ready: false,
				statusMessage: ''
			}
		},
		props: {
			video: Object
		},
		mounted: function() {
			let v = this;
			v.resizeWindowEventHandler();
			v.videoport = new Videoport(v.video, v, v.$refs.canvas);
		},
		beforeMount: function () {
			let v = this;
			v.resizeWindowEventHandler = function () {
				let ratio = window['devicePixelRatio'] || 1;
				let canvas = v.$refs.canvas;
				let newWidth = canvas.clientWidth * ratio;
				let newHeight = canvas.clientHeight * ratio;
				let isCanvasInvalid = !newWidth || !newHeight;
				let justResized = v.width !== newWidth || v.height !== newHeight;
				v.width = newWidth;
				v.height = newHeight;
				v.isFullscreen = document.fullscreenElement === v.$el;
				if(isCanvasInvalid || justResized){
					requestAnimationFrame(v.resizeWindowEventHandler);
				}
				if(!isCanvasInvalid && justResized){
					requestAnimationFrame(function(){
						if(v.playing){
							v.playToggle();
						}
						v.videoport.sizeWindow(newWidth, newHeight);
					});
				}
			};
			document.addEventListener('resize', v.resizeWindowEventHandler);
			document.addEventListener('fullscreenchange', v.resizeWindowEventHandler);
			window.addEventListener('resize', v.resizeWindowEventHandler);
		},
		beforeDestroy: function () {
			let v = this;
			v.videoport.die();
			document.removeEventListener('resize', v.resizeWindowEventHandler);
			document.removeEventListener('fullscreenchange', v.resizeWindowEventHandler);
			window.removeEventListener('resize', v.resizeWindowEventHandler);
		},
		methods: {
			activity: function(){
				let v = this;
				v.activityHalted = false;
				if(v.activityTimeoutId){
					clearTimeout(v.activityTimeoutId);
				}
				v.activityTimeoutId = setTimeout(function(){
					v.activityHalted = true;
					v.activityTimeoutId = null;
				}, 3000);
			},
			playToggle: function(event){
				let v = this;
				v.started = true;
				v.playing = !v.playing;
				v.videoport.setPlay(v.playing);
			},
			fullscreenToggle: function(){
				let canFullScreen = this.$el.requestFullscreen !== undefined;
				this.activity();
				if(canFullScreen){
					if (!this.isFullscreen) {
						this.$el.requestFullscreen();
					} else {
						if (document.exitFullscreen) {
							document.exitFullscreen();
						}
					}
				} else {
					this.$el.scrollIntoView();
				}
			}
		},
		template: `
			<div class="videoport noSelect"
				:class="{
					fullscreen: isFullscreen,
					hideCursor: playing && activityHalted
				}"
				v-on:mousemove="activity"
				v-on:touchmove="activity"
				v-on:touchstart="activity"
			>
				<div class="aspectEnforcer">
					<canvas
						ref="canvas"
						:width="width"
						:height="height"
						/>
					<div class="overlay" @click="playToggle">
						<transition-group name="fade">
							<img key="a" v-if="!decoded" :src="previewUrl(video)" />
							<div key="b" v-if="!ready" class="statusMessage">
								<div>{{statusMessage}}</div>
								<div>Loaded: {{loaded.toFixed(2)}}</div>
								<div>Decoded: {{decoded.toFixed(2)}}</div>
								<div>Scaled: {{scaled.toFixed(2)}}</div>
							</div>
							<video-status-icon key="c" class="large rotating" v-if="!ready && started && playing" type="loading" />
							<video-status-icon key="d" class="large" v-if="!started || !playing" type="play" />
						</transition-group>
					</div>
					<transition-group key="fullscreen" name="fade">
						<div
							key="a"
							v-if="!playing || !activityHalted"
							@click="fullscreenToggle"
						>
							<video-status-icon class="fullscreen" key="off" v-if="!isFullscreen" type="fullscreen" />
							<video-status-icon class="fullscreen" key="on"  v-if="isFullscreen" type="fullscreenExit" />
						</div>
					</transition-group>
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
				<g class="fade">
					<path :d="getShape(type)" class="stroke" />
					<path :d="getShape(type)" class="fill" />
				</g>
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

let Videoport = function(video, vue, canvas){
	let p = this;
	p.video = video;
	p.vue = vue;
	p.canvas = canvas;
	p.context = canvas.getContext('2d');
	p.shouldPlay = false;
	p.scaledCanvasList = [];
	p.lastDisplayedImage = null;
	p.lastDisplayedIndex = 0;
	p.scaledFrameCount = 0;
	p.ready = false;
	p.playOffset = 0;
	p.prevFrame = 0;
	p.sourceBuffer = decodedFrameBufferMap[p.video.name] || new DecodedFrameBuffer(p.video);
	p.sourceBuffer.addVideoport(p);
	p.renderLoop = function (time) {
		if(p.shouldPlay){
			requestAnimationFrame(p.renderLoop);
			if(p.ready){
				p.render(time);
			}
		}
	};
};

Videoport.prototype = {
	fps: 24,
	die: function(){
		this.sourceBuffer.removeVideoport(this);
		this.scaledCanvasList.forEach(function (canvas) {
			canvas.width = 0;
			canvas.height = 0;
		});
		this.scaledCanvasList = [];
		this.shouldPlay = false;
	},
	setPlay: function(shouldPlay){
		let p = this;
		p.shouldPlay = shouldPlay;
		p.sourceBuffer.load();
		p.updateUI();
		if(shouldPlay){
			requestAnimationFrame(function (time) {
				p.lastTimeSample = time;
				p.renderLoop(time);
			});
		}
	},
	render: function (time) {
		let p = this;
		let delta = time - (p.lastTimeSample || 0);
		p.playOffset += delta;
		p.setFrameByTime(p.playOffset);
		p.lastTimeSample = time;
	},
	setFrameByTime: function(time){
		let p = this;
		let frames = p.sourceBuffer.frameCount;
		let currentFrame = Math.floor(time / 1000 / (frames / p.fps) * frames) % frames;
		if(currentFrame !== p.prevFrame){
			p.lastDisplayedImage = p.getScaledCanvasByFrameIndex(currentFrame);
			p.context.drawImage(p.lastDisplayedImage, 0, 0);
			p.prevFrame = currentFrame;
		}
	},
	getScaledCanvasByFrameIndex: function (frameIndex) {
		let p = this;
		let list = p.scaledCanvasList;
		let canvas = list[frameIndex] || document.createElement('canvas');
		let needUpdate = (
			!list[frameIndex] ||
			canvas.width !== p.width ||
			canvas.height !== p.height
		);
		if(needUpdate){
			let imageSource = p.sourceBuffer.imageList[frameIndex];
			let context = canvas.getContext('2d');
			canvas.width = p.width;
			canvas.height = p.height;
			context.imageSmoothingQuality = "high";
			context.drawImage(imageSource, 0, 0, p.width, p.height);

			if(!list[frameIndex]){
				list[frameIndex] = canvas;
			}
		}
		return canvas;
	},
	sizeWindow: function (newWidth, newHeight) {
		let p = this;
		let hasAnyFrameDecodedYet = p.lastDisplayedImage !== null;
		p.width = newWidth;
		p.height = newHeight;
		p.scaledFrameCount = 0;
		if(hasAnyFrameDecodedYet){
			p.lastDisplayedImage = p.getScaledCanvasByFrameIndex(p.prevFrame);
			requestAnimationFrame(function() {
				p.context.drawImage(p.lastDisplayedImage, 0, 0);
			});
		}
	},
	scaleAllFramesAndReady: function () {
		let p = this;
		p.context.drawImage(p.getScaledCanvasByFrameIndex(p.scaledFrameCount++), 0, 0);
		setTimeout(function () {
			if(p.scaledFrameCount === p.sourceBuffer.frameCount){
				p.ready = true;
			}
			p.updateUI();
		}, 0);
	},
	updateUI: function(){
		let p = this;
		let b = p.sourceBuffer;
		let vue = p.vue;
		let scaled = p.scaledFrameCount / b.frameCount;
		let status;
		vue.loaded = b.loaded;
		vue.decoded = b.decoded;
		vue.scaled = scaled;
		p.ready = b.ready && scaled === 1;
		if(b.ready && !p.ready && p.shouldPlay){
			status = `Scaled ${p.scaledFrameCount}/${b.frameCount} frames`;
			p.scaleAllFramesAndReady();
		}
		if(p.ready){
			status = 'Ready';
		}
		vue.statusMessage = status || b.status;
		let displayFrame = p.ready ? p.prevFrame : b.ready ? Math.max(0, p.scaledFrameCount - 1) : b.lastStoredFrameIndex;
		if(displayFrame !== null){
			p.lastDisplayedImage = p.getScaledCanvasByFrameIndex(displayFrame);
		}
		if(p.lastDisplayedImage){
			//I guess you can't draw from a context the instant it's created?
			requestAnimationFrame(function(){
				p.context.drawImage(p.lastDisplayedImage, 0, 0);
			});
		}
		requestAnimationFrame(function () {
			//ensures that Vue updates the status before fading it out
			vue.ready = p.ready;
		});
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
	b.imageList = [];
	b.videoportList = [];
	b.framesLoaded = 0;
	b.lastStoredFrameIndex = null;
	b.decoder = new DecoderImage(b);
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
			p.updateUI();
		});
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
		if(loadingProgressEvent.total){
			this.totalSize = loadingProgressEvent.total;
		}
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
	handleDecoderFrame: function(frameCanvas, index){
		let b = this;
		b.framesLoaded += 1;
		b.imageList[index] = frameCanvas;
		b.decoded = b.framesLoaded / b.frameCount;
		b.lastStoredFrameIndex = index;
		b.status = `Decoded ${b.framesLoaded} / ${b.frameCount} frames`;
		if(b.decoded === 1){
			b.status = `Ready; Loaded & Decoded`;
			b.ready = true;
			b.decoder = null;
		}
		this.updateVideoports();
	},
};
