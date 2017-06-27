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
				cssWidth: 0,
				started: false,
				playing: false,
				isFullscreen: false,
				activityHalted: true,
				loaded: 0,
				scaled: 0,
				playOffset: 0,
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
				v.cssWidth = canvas.clientWidth;
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
				}, 2000);
			},
			playToggle: function(event){
				let v = this;
				v.started = true;
				v.playing = !v.playing;
				v.videoport.setPlay(v.playing);
				v.$ga.event({
					eventCategory: 'Video',
					eventAction: `${v.playing ? 'play' : 'pause'}-${v.isFullscreen ? 'fullscreen' : 'windowed'}`,
					eventLabel: v.video.title
				});
			},
			fullscreenToggle: function(){
				let v = this;
				let canFullScreen = v.$el.requestFullscreen !== undefined;
				v.activity();
				let action;
				if(canFullScreen){
					if (!v.isFullscreen) {
						v.$el.requestFullscreen();
						action = 'requestFullscreen';
					} else {
						if (document.exitFullscreen) {
							document.exitFullscreen();
							action = 'exitFullscreen';
						}
					}
				} else {
					v.$el.scrollIntoView();
					action = 'scrollIntoView';
				}
				v.$ga.event({
					eventCategory: 'Video',
					eventAction: `fullscreen-${action}`,
					eventLabel: v.video.title
				});
			}
		},
		template: `
			<div class="videoport"
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
						<transition-group name="videoport_fade">
							<img key="a" v-if="!loaded" :src="previewUrl(video)" />
							<div key="b" v-if="!ready && started" class="statusMessage">
								<div>{{statusMessage}}</div>
							</div>
							<video-play-icon key="c" v-if="!playing" />
						</transition-group>
					</div>
					<transition-group name="videoport_fade">
						<video-controller key="e"
							v-if="!ready || !playing || !activityHalted"
							:width="cssWidth"
							:started="started"
							:playing="playing"
							:isFullscreen="isFullscreen"
							:loaded="loaded"
							:scaled="scaled"
							:ready="ready"
							:playOffset="playOffset"
							:playToggle="playToggle"
							:fullscreenToggle="fullscreenToggle"
							/>
					</transition-group>
				</div>
			</div>
		`
	}
);

Vue.component(
	'video-play-icon',
	{
		props: {
			shape: {
				default: 'M112,64A48,48,0,1,1,64,16,48,48,0,0,1,112,64ZM48,43.21539V84.78461a4,4,0,0,0,6,3.4641L90,67.4641a4,4,0,0,0,0-6.9282L54,39.75129A4,4,0,0,0,48,43.21539Z'
			}
		},
		template: `
			<svg class="video-play-icon" viewBox="0 0 128 128">
				<g class="fade">
					<path :d="shape" class="stroke" />
					<path :d="shape" class="fill" />
				</g>
			</svg>
		`
	}
);

Vue.component(
	'video-controller',
	{
		props: {
			started: Boolean,
			playing: Boolean,
			ready: Boolean,
			isFullscreen: Boolean,
			loaded: Number,
			scaled: Number,
			width: Number,
			playOffset: Number,
			playToggle: Function,
			fullscreenToggle: Function
		},
		created: function () {
			this.padding = 56;
		},
		computed: {
			lineWidth: function () {
				return this.width - (this.padding * 2);
			}
		},
		methods: {
			lineFrac: function (n) {
				return this.padding + (this.lineWidth * n);
			}
		},
		template: `
			<svg class="video-controller" :viewBox="'0 0 ' + width + ' 64'">
				<defs>
					<path id="screen-line" class="stroke screen-line" d="M3.5,3.5l5,5"/>
					<path id="full-triangle" class="fill" d="M10,9V4.41421a1,1,0,0,0-1.70711-.70711L3.70711,8.29289A1,1,0,0,0,4.41421,10H9A1,1,0,0,0,10,9Z"/>
					<path id="exit-triangle" class="fill" d="M8.29289,3.70711,3.70711,8.29289A1,1,0,0,1,2,7.58579V3A1,1,0,0,1,3,2H7.58579A1,1,0,0,1,8.29289,3.70711Z"/>
					<g id="full-corner">
						<use xlink:href="#screen-line" />
						<use xlink:href="#full-triangle" />
					</g>
					<g id="exit-corner">
						<use xlink:href="#screen-line" />
						<use xlink:href="#exit-triangle" />
					</g>
					<g id="icon-fullscreen">
						<g transform="translate(24, 24)">
							<use xlink:href="#full-corner" transform="rotate(  0)"/>
							<use xlink:href="#full-corner" transform="rotate( 90)"/>
							<use xlink:href="#full-corner" transform="rotate(180)"/>
							<use xlink:href="#full-corner" transform="rotate(-90)"/>
						</g>
					</g>
					<g id="icon-fullscreen-exit">
						<g transform="translate(24, 24)">
							<use xlink:href="#exit-corner" transform="rotate(  0)"/>
							<use xlink:href="#exit-corner" transform="rotate( 90)"/>
							<use xlink:href="#exit-corner" transform="rotate(180)"/>
							<use xlink:href="#exit-corner" transform="rotate(-90)"/>
						</g>
					</g>
					<path id="icon-play" class="fill" d="M17,15.33975V32.66025a2,2,0,0,0,3,1.73205l15-8.66025a2,2,0,0,0,0-3.4641L20,13.6077A2,2,0,0,0,17,15.33975Z"/>
					<g id="icon-loading">
						<path class="fill" d="M28.56066,26.56066l4.37868,4.37868a1.5,1.5,0,0,0,2.12132,0l4.37868-4.37868A1.5,1.5,0,0,0,38.37868,24H29.62132A1.5,1.5,0,0,0,28.56066,26.56066Z"/>
						<path class="stroke loading" d="M24,34A10,10,0,1,1,34,24"/>
					</g>
					<path id="icon-pause" class="fill" d="M19,34H17a2,2,0,0,1-2-2V16a2,2,0,0,1,2-2h2a2,2,0,0,1,2,2V32A2,2,0,0,1,19,34Zm12,0H29a2,2,0,0,1-2-2V16a2,2,0,0,1,2-2h2a2,2,0,0,1,2,2V32A2,2,0,0,1,31,34Z"/>
				</defs>
				<g>
					<g v-if="started">
						<rect class="background" :width="width" height="64"/>
						<g class="progressLines">
							<line class="stroke total"  :x1="padding"  y1="24" :x2="lineFrac(1)" y2="24"/>
							<line class="stroke loaded" :x1="padding"  y1="24" :x2="lineFrac(loaded)" y2="24"/>
							<line class="stroke scaled" :x1="padding"  y1="24" :x2="lineFrac(scaled)" y2="24"/>
						</g>
						<g class="playhead" :transform="'translate('+lineFrac(playOffset)+', 0)'">
							<line class="stroke back"  x1="0" y1="22" x2="0" y2="26" />
							<line class="stroke front" x1="0" y1="14" x2="0" y2="34" />
						</g>
						<g @click="playToggle">
							<use xlink:href="#icon-play" key="play"  v-if="!playing"/>
							<use xlink:href="#icon-pause" key="pause" v-if="playing && ready"/>
							<g key="loading" v-if="!ready && started && playing" transform="translate(24, 24)">
								<g class="rotating">
									<g transform="translate(-24, -24)">
										<use xlink:href="#icon-loading"/>
									</g>
								</g>
							</g>
							<rect opacity="0" width="48" height="48"/>
						</g>
					</g>
					<g
						:transform="'translate('+(width - 48)+', 0)'"
						@click="fullscreenToggle">
						<rect v-if="!started" class="fullscreenBackground" x="8" y="8" width="32" height="32" rx="4" ry="4"/>
						<use xlink:href="#icon-fullscreen"      key="off" v-if="!isFullscreen"/>
						<use xlink:href="#icon-fullscreen-exit" key="on"  v-if="isFullscreen"/>
						<rect opacity="0" width="48" height="48"/>
					</g>
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
		let p = this;
		p.sourceBuffer.removeVideoport(this);
		p.scaledCanvasList.forEach(function (canvas) {
			canvas.width = 0;
			canvas.height = 0;
		});
		p.scaledCanvasList = [];
		p.shouldPlay = false;
		p.vue.$ga.event({
			eventCategory: 'Video',
			eventAction: 'unload',
			eventLabel: p.video.title
		});
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
			p.vue.playOffset = currentFrame / frames;
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
				p.updateUI();
			});
		}
	},
	scaleAllFramesAndReady: function () {
		let p = this;
		p.context.drawImage(p.getScaledCanvasByFrameIndex(p.scaledFrameCount++), 0, 0);
		setTimeout(function () {
			if(p.scaledFrameCount === p.sourceBuffer.frameCount){
				p.ready = true;
				p.vue.$ga.event({
					eventCategory: 'Video',
					eventAction: 'scale-finish',
					eventLabel: p.video.title,
					eventValue: p.width
				});
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
		vue.scaled = scaled;
		p.ready = b.ready && scaled === 1;
		if(b.ready && !p.ready){
			if(p.scaledFrameCount){
				status = `Scaled ${p.scaledFrameCount}/${b.frameCount} frames`;
			}
			if(p.shouldPlay){
				p.scaleAllFramesAndReady();
			}
			if(!p.scaledFrameCount && p.shouldPlay){
				p.vue.$ga.event({
					eventCategory: 'Video',
					eventAction: 'scale-start',
					eventLabel: p.video.title,
					eventValue: p.width
				});
			}
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
	b.video = video;
	b.videoAddress = mixinAddresses.methods.videoUrl(video);
	b.frameCount = parseInt(video.name.split('-').pop(), 10);
	b.started = false;
	b.totalSize = 0;
	b.loaded = 0;
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
			Vue.$ga.event({
				eventCategory: 'Video',
				eventAction: 'load-start',
				eventLabel: b.video.title
			});
		}
	},
	handleDecoderLoadStart: function(){
		this.status = 'Loading started';
		this.updateVideoports();
	},
	handleDecoderFrame: function(frameCanvas, index){
		let b = this;
		b.framesLoaded += 1;
		b.imageList[index] = frameCanvas;
		b.loaded = b.framesLoaded / b.frameCount;
		b.lastStoredFrameIndex = index;
		b.status = `Loaded ${b.framesLoaded} / ${b.frameCount} frames`;
		if(b.loaded === 1){
			b.status = `All frames Loaded`;
			b.ready = true;
			b.decoder = null;
			Vue.$ga.event({
				eventCategory: 'Video',
				eventAction: 'load-finish',
				eventLabel: b.video.title
			});
		}
		this.updateVideoports();
	},
};
