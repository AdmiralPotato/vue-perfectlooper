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
				statusMessage: '',
				isIOS: false,
				isIOSWarnNeeded: false
			}
		},
		props: {
			video: Object
		},
		created: function() {
			this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
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
				let isFullscreen = document.fullscreenElement === v.$el;
				let fullscreenChanged = v.isFullscreen !== isFullscreen;
				v.cssWidth = canvas.clientWidth;
				v.width = newWidth;
				v.height = newHeight;
				v.isFullscreen = isFullscreen;
				if(isCanvasInvalid || justResized){
					requestAnimationFrame(v.resizeWindowEventHandler);
				}
				if(!isCanvasInvalid && justResized){
					requestAnimationFrame(function(){
						if(v.playing){
							v.playToggle();
							requestAnimationFrame(function(){
								v.playToggle();
							});
						}
						if(fullscreenChanged){
							requestAnimationFrame(function(){
								v.videoport.sizeWindow(newWidth, newHeight);
							});
						} else {
							v.videoport.sizeWindow(newWidth, newHeight);
						}
					});
				}
			};
			v.fullscreenFocusChangeHandler = function (event) {
				let relativePosition = v.$el.compareDocumentPosition(event.target);
				let contains = (relativePosition & Node.DOCUMENT_POSITION_CONTAINED_BY) > 0;
				if(v.isFullscreen && !contains){
					let before = (relativePosition & Node.DOCUMENT_POSITION_PRECEDING) > 0;
					let after = (relativePosition & Node.DOCUMENT_POSITION_FOLLOWING) > 0;
					let focusSelector = before ? '.lastFocus' : after ? '.firstFocus' : null;
					let focusTarget = focusSelector ? v.$el.querySelector(focusSelector) : null;
					if(focusTarget){
						focusTarget.focus();
					}
				}
			};
			document.addEventListener('resize', v.resizeWindowEventHandler);
			document.addEventListener('fullscreenchange', v.resizeWindowEventHandler);
			window.addEventListener('resize', v.resizeWindowEventHandler);
			document.body.addEventListener('focus', v.fullscreenFocusChangeHandler, true);
			if(v.isIOS){
				v.isMounted = true;
				v.scrollWarningWatcher = function () {
					if(v.isMounted){
						requestAnimationFrame(v.scrollWarningWatcher);
						let videoportRect = v.$el.getBoundingClientRect();
						let controlButton = v.$el.querySelector('button');
						let buttonHeight = controlButton ? controlButton.clientHeight : 0;
						let height = videoportRect.height;
						let bottom = videoportRect.bottom;
						v.isIOSWarnNeeded = bottom >= height - buttonHeight && bottom <= height + buttonHeight;
					}
				};
				requestAnimationFrame(v.scrollWarningWatcher);
			}
		},
		beforeDestroy: function () {
			let v = this;
			v.videoport.die();
			document.removeEventListener('resize', v.resizeWindowEventHandler);
			document.removeEventListener('fullscreenchange', v.resizeWindowEventHandler);
			window.removeEventListener('resize', v.resizeWindowEventHandler);
			document.body.removeEventListener('focus', v.fullscreenFocusChangeHandler, true);
			if(v.isIOS){v.isMounted = false;}
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
			step: function (direction) {
				let v = this;
				if(!v.started){
					v.playToggle();
				}
				if(v.loaded === 1){
					v.playing = false;
					v.videoport.setPlay(false);
					v.videoport.step(direction);
				}
			},
			scrub: function (playOffset) {
				let v = this;
				if(v.loaded === 1){
					let preventOffsetWrapping = Math.max(0, playOffset - 0.000000001);
					v.playing = false;
					v.videoport.setPlay(false);
					v.videoport.setTime(preventOffsetWrapping);
					v.videoport.setFrameByTime();
				}
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
			},
			focusHandler: function (event) {
				event.stopPropagation();
				this.activity();
				this.focusElement = event.target;
			},
			blurHandler: function (event) {
				event.stopPropagation();
				this.focusElement = undefined;
			},
			leftHandler: function (event) {
				event.preventDefault();
				this.step(-1);
			},
			rightHandler: function (event) {
				event.preventDefault();
				this.step(1);
			},
			spaceHandler: function (event) {
				let shouldHandle = !(this.focusElement && this.focusElement.tagName === 'BUTTON');
				if(shouldHandle){
					event.preventDefault();
					this.playToggle();
				}
			}
		},
		template: `
			<div class="videoport"
				:class="{
					fullscreen: isFullscreen,
					hideCursor: playing && activityHalted,
					ios: isIOS,
					iosDangerZone: isIOSWarnNeeded
				}"
				@mousemove="activity"
				@touchmove="activity"
				@touchstart="activity"
				@focus.capture="focusHandler"
				@blur.capture="blurHandler"
				@keydown.capture.left="leftHandler"
				@keydown.capture.right="rightHandler"
				@keydown.capture.space="spaceHandler"
			>
				<div class="aspectEnforcer">
					<canvas
						ref="canvas"
						:width="width"
						:height="height"
						/>
					<div
						class="overlay firstFocus"
						@click="playToggle"
						@keyup.enter="playToggle"
						tabindex="0"
						role="button">
						<transition-group name="videoport_fade">
							<img key="a" v-if="!loaded" :src="previewUrl(video)" />
							<div key="b" v-if="!ready && started" class="statusMessage">
								<div>{{statusMessage}}</div>
							</div>
							<video-play-icon key="c" v-if="!started" />
						</transition-group>
					</div>
					<video-controller
						:class="{hidden: !(!ready || !playing || !activityHalted)}"
						:width="cssWidth"
						:started="started"
						:playing="playing"
						:isFullscreen="isFullscreen"
						:loaded="loaded"
						:scaled="scaled"
						:ready="ready"
						:playOffset="playOffset"
						:playToggle="playToggle"
						:step="step"
						:scrub="scrub"
						:fullscreenToggle="fullscreenToggle"
						/>
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
					<path :d="shape" fill="currentColor" />
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
			step: Function,
			scrub: Function,
			fullscreenToggle: Function
		},
		template: `
			<div class="video-controller">
				<video-controller-defs />
				<div v-if="started">
					<video-controller-bar
						:loaded="loaded"
						:scaled="scaled"
						:width="width"
						:playOffset="playOffset"
						:scrub="scrub"
						/>
					<video-controller-button
						label="Step 1 frame backward"
						class="step-prev"
						@click.native="step(-1)">
						<g transform="translate(24, 24)">
							<g transform="rotate(180)">
								<g transform="translate(-24, -24)">
									<use xlink:href="#icon-advance"/>
								</g>
							</g>
						</g>
					</video-controller-button>
					<video-controller-button
						:label="playing ? 'Pause' : 'Play'"
						class="playToggle"
						@click.native="playToggle">
						<use xlink:href="#icon-play" key="play"  v-if="!playing"/>
						<use xlink:href="#icon-pause" key="pause" v-if="playing && ready"/>
						<g key="loading" v-if="!ready && started && playing" transform="translate(24, 24)">
							<g class="rotating">
								<g transform="translate(-24, -24)">
									<use xlink:href="#icon-loading"/>
								</g>
							</g>
						</g>
					</video-controller-button>
					<video-controller-button
						label="Step 1 frame forward"
						class="step-next"
						@click.native="step(1)">
						<use xlink:href="#icon-advance"/>
					</video-controller-button>
				</div>
				<video-controller-button
					label="Toggle Fullscreen"
					class="fullscreenToggle lastFocus"
					@click.native="fullscreenToggle">
					<rect v-if="!started" class="fullscreenBackground" x="8" y="8" width="32" height="32" rx="4" ry="4"/>
					<use xlink:href="#icon-fullscreen"      key="off" v-if="!isFullscreen"/>
					<use xlink:href="#icon-fullscreen-exit" key="on"  v-if="isFullscreen"/>
				</video-controller-button>
			</div>
		`
	}
);

Vue.component(
	'video-controller-bar',
	{
		mixins: [touchHandlingMixin],
		props: {
			loaded: Number,
			scaled: Number,
			width: Number,
			playOffset: Number,
			scrub: Function
		},
		created: function () {
			let bar = this;
			bar.padLeft = (48 * 3) + 16;
			bar.padRight = 48 + 16;
			bar.handleMouseDown = function(event){
				bar.offsetTimeByMouseEvent(event);
				bar.isDragging = true;
			};
			bar.handleMouseMove = function(event){
				if(bar.isDragging){
					bar.offsetTimeByMouseEvent(event);
				}
			};
			bar.handleMouseUp = function(event){
				if(bar.isDragging) {
					bar.offsetTimeByMouseEvent(event);
					bar.isDragging = false;
				}
			};
		},
		mounted: function () {
			document.body.addEventListener('mousemove', this.handleMouseMove, true);
			document.body.addEventListener('mouseup', this.handleMouseUp, true);
		},
		beforeDestroy: function () {
			document.body.removeEventListener('mousemove', this.handleMouseMove, true);
			document.body.removeEventListener('mouseup', this.handleMouseUp, true);
		},
		computed: {
			lineWidth: function () {
				return this.width - (this.padLeft + this.padRight);
			}
		},
		methods: {
			lineFrac: function (n) {
				return this.padLeft + (this.lineWidth * n);
			},
			offsetTimeByMouseEvent: function (event) {
				let controllerRect = this.$el.getBoundingClientRect();
				let offset = this.mapPointToPlayOffset(event.screenX - controllerRect.left);
				event.preventDefault();
				this.scrub(offset);
			},
			dragStart: function(point, event){this.offsetTimeByPoint(point, event);},
			dragMove: function(point, event){this.offsetTimeByPoint(point, event);},
			dragEnd: function(point, event){this.offsetTimeByPoint(point, event);},
			offsetTimeByPoint: function (point, event) {
				let offset = this.mapPointToPlayOffset(point.x);
				event.preventDefault();
				this.scrub(offset);
			},
			mapPointToPlayOffset: function (x) {
				return Math.max(0, Math.min(1, (x - this.padLeft) / this.lineWidth));
			}
		},
		template: `
			<svg class="video-controller-bar" :viewBox="'0 0 ' + width + ' 48'">
				<g
					@mousedown="handleMouseDown"
					@touhstart="handleTouchStart"
					@touchmove="handleTouchMove"
					@touchend="handleTouchEnd"
					>
					<rect class="background" :width="width" height="48"/>
					<g class="progressLines">
						<line class="stroke total"  :x1="padLeft"  y1="24" :x2="lineFrac(1)" y2="24"/>
						<line class="stroke loaded" :x1="padLeft"  y1="24" :x2="lineFrac(loaded)" y2="24"/>
						<line class="stroke scaled" :x1="padLeft"  y1="24" :x2="lineFrac(scaled)" y2="24"/>
					</g>
					<g class="playhead" :transform="'translate('+lineFrac(playOffset)+', 0)'">
						<line class="stroke back"  x1="0" y1="22" x2="0" y2="26" />
						<line class="stroke front" x1="0" y1="14" x2="0" y2="34" />
					</g>
				</g>
			</svg>
		`
	}
);

Vue.component(
	'video-controller-button',
	{
		props: {
			label: String
		},
		template: `
			<button :title="label" :alt="label">
				<svg viewBox="2 2 44 44">
					<slot />
					<use xlink:href="#button-click-mask" />
				</svg>
			</button>
		`
	}
);

Vue.component(
	'video-controller-defs',
	{
		template: `
			<svg class="video-controller-defs" style="display: none;">
				<defs>
					<path id="screen-line" class="stroke screen-line" stroke="currentColor" d="M3.5,3.5l5,5"/>
					<path id="full-triangle" fill="currentColor" d="M10,9V4.41421a1,1,0,0,0-1.70711-.70711L3.70711,8.29289A1,1,0,0,0,4.41421,10H9A1,1,0,0,0,10,9Z"/>
					<path id="exit-triangle" fill="currentColor" d="M8.29289,3.70711,3.70711,8.29289A1,1,0,0,1,2,7.58579V3A1,1,0,0,1,3,2H7.58579A1,1,0,0,1,8.29289,3.70711Z"/>
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
					<path id="icon-play" fill="currentColor" d="M17,15.33975V32.66025a2,2,0,0,0,3,1.73205l15-8.66025a2,2,0,0,0,0-3.4641L20,13.6077A2,2,0,0,0,17,15.33975Z"/>
					<g id="icon-loading">
						<path fill="currentColor" d="M28.56066,26.56066l4.37868,4.37868a1.5,1.5,0,0,0,2.12132,0l4.37868-4.37868A1.5,1.5,0,0,0,38.37868,24H29.62132A1.5,1.5,0,0,0,28.56066,26.56066Z"/>
						<path class="stroke loading" stroke="currentColor" d="M24,34A10,10,0,1,1,34,24"/>
					</g>
					<path id="icon-pause" fill="currentColor" d="M19,34H17a2,2,0,0,1-2-2V16a2,2,0,0,1,2-2h2a2,2,0,0,1,2,2V32A2,2,0,0,1,19,34Zm12,0H29a2,2,0,0,1-2-2V16a2,2,0,0,1,2-2h2a2,2,0,0,1,2,2V32A2,2,0,0,1,31,34Z"/>
					<path id="icon-advance" fill="currentColor" d="M26.125,16.85529l9,5.19615a2.25,2.25,0,0,1,0,3.89711l-9,5.19615a2.25,2.25,0,0,1-3.375-1.94856V18.80385A2.25,2.25,0,0,1,26.125,16.85529ZM17.75,29.5v-11a2,2,0,0,0-2-2h-.5a2,2,0,0,0-2,2v11a2,2,0,0,0,2,2h.5A2,2,0,0,0,17.75,29.5Z"/>
					<rect id="button-click-mask" opacity="0" x="2" y="2" width="44" height="44" />
				</defs>
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
	p.scaled = 0;
	p.ready = false;
	p.playOffset = 0;
	p.prevFrame = 0;
	p.sourceBuffer = decodedFrameBufferMap[p.video.name] || new DecodedFrameBuffer(p.video);
	p.frameCount = p.sourceBuffer.frameCount;
	p.duration = p.frameCount / p.fps;
	p.sourceBuffer.addVideoport(p);
	p.renderLoop = function (time) {
		if(p.shouldPlay){
			requestAnimationFrame(p.renderLoop);
			if(p.ready){
				p.play(time);
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
	play: function (time) {
		let p = this;
		p.offsetTime(((time - (p.lastTimeSample || 0)) / 1000) / p.duration);
		p.setFrameByTime();
		p.lastTimeSample = time;
	},
	offsetTime: function (delta) {
		this.setTime(this.playOffset + delta);
	},
	setTime: function (playOffset) {
		this.playOffset = this.rangeBind(playOffset, 1);
	},
	rangeBind: function (value, max) {
		return Math.sign(value) === -1 ? max + (value % max) : value % max;
	},
	step: function (direction) {
		let p = this;
		let targetFrame = p.rangeBind(p.prevFrame + direction,  p.frameCount);
		p.offsetTime((1 / p.frameCount) * direction);
		p.setFrameByIndex(targetFrame);
	},
	setFrameByTime: function(){
		let p = this;
		let targetFrame = Math.floor(p.playOffset * p.frameCount);
		if(targetFrame !== p.prevFrame){
			p.setFrameByIndex(targetFrame);
		}
	},
	setFrameByIndex: function (frameIndex) {
		let p = this;
		p.lastDisplayedImage = p.getScaledCanvasByFrameIndex(frameIndex);
		p.context.drawImage(p.lastDisplayedImage, 0, 0);
		p.prevFrame = frameIndex;
		p.vue.playOffset = frameIndex / (p.frameCount - 1);
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
		p.width = newWidth;
		p.height = newHeight;
		p.scaledFrameCount = 0;
		p.scaled = 0;
		p.ready = false;
		p.updateUI();
	},
	scaleAllFramesAndReady: function () {
		let p = this;
		let frame = p.scaledFrameCount++;
		if(!frame){
			p.vue.$ga.event({
				eventCategory: 'Video',
				eventAction: 'scale-start',
				eventLabel: p.video.title,
				eventValue: p.width
			});
		}
		p.context.drawImage(p.getScaledCanvasByFrameIndex(frame), 0, 0);
		p.scaled = p.scaledFrameCount / p.frameCount;
		setTimeout(function () {
			if(p.scaledFrameCount === p.frameCount){
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
		let status = b.status;
		let displayFrame = p.whichFrameShouldBeDisplayedOnUpdate();
		if(b.ready && !p.ready){
			if(p.scaledFrameCount){
				status = `Scaled ${p.scaledFrameCount}/${b.frameCount} frames`;
			}
			if(p.shouldPlay){
				p.scaleAllFramesAndReady();
			}
		}
		if(p.ready){
			status = 'Ready';
		}
		if(displayFrame !== null){
			p.lastDisplayedImage = p.getScaledCanvasByFrameIndex(displayFrame);
		}
		if(p.lastDisplayedImage){
			p.context.drawImage(p.lastDisplayedImage, 0, 0);
		}
		vue.statusMessage = status;
		vue.loaded = b.loaded;
		vue.scaled = p.scaled;
		vue.ready = p.ready;
	},
	whichFrameShouldBeDisplayedOnUpdate: function(){
		let p = this;
		let b = p.sourceBuffer;
		let displayFrame = b.lastStoredFrameIndex;
		if(b.ready) {
			if (!p.shouldPlay || p.ready) {
				displayFrame = p.prevFrame;
			} else {
				displayFrame = Math.max(0, p.scaledFrameCount - 1);
			}
		}
		return displayFrame;
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
