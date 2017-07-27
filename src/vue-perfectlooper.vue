<template>
	<div
		class="perfectlooper"
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
				role="button"
			>
				<transition-group name="perfectlooper_fade">
					<img key="a" v-if="!loaded && posterPath" :src="posterPath" />
					<div key="b" v-if="!ready && started" class="statusMessage">
						<div>{{statusMessage}}</div>
					</div>
					<perfectlooper-play-icon key="c" v-if="!started" />
				</transition-group>
			</div>
			<perfectlooper-control
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
</template>

<script>
	import CanvasLooper from './canvas-looper.js';
	import SequencePaths from './sequence-paths';
	import PerfectlooperPlayIcon from './perfectlooper-play-icon';
	import PerfectlooperControl from './perfectlooper-control';

	export default {
		components: {PerfectlooperPlayIcon, PerfectlooperControl},
		props: {
			id: {
				type: String,
				required: true
			},
			poster: {
				type: String,
				required: false
			},
			src: {
				type: [String, Array],
				required: false
			},
			frames: {
				type: [Number, String],
				required: false
			},
			startIndex: {
				type: [Number, String],
				required: false,
				default: 1
			},
			sequenceTemplate: {
				type: String,
				default: '0000'
			},
			prefix: {
				type: String,
				default: ''
			},
			suffix: {
				type: String,
				default: '.jpg'
			},
			srcImgurAlbumId: {
				type: String,
				required: false
			}
		},
		data: function() {
			return {
				width: 0,
				height: 0,
				cssWidth: 0,
				cssHeight: 0,
				pathsLoaded: false,
				posterPath: '',
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
		created: function(){
			let v = this;
			SequencePaths.get(
				v,
				function (pathList, poster) {
					if(!pathList){
						throw new Error('vue-perfectlooper: No valid combinations of paths provided. Please supply one of the following combinations:\n\t{src: String, frames: Number}\n\t{src: Array of Strings}\n\t{srcImgurAlbumId: String}');
					}
					if(!poster){
						throw new Error('vue-perfectlooper: No valid combinations of poster options provided. Please add a valid poster image path:\n\t{poster: String}');
					}
					v.pathList = pathList;
					v.posterPath = poster;
					v.pathsLoaded = true;
					v.makeLooper();
				},
				function(poster){
					v.posterPath = poster;
				}
			);
		},
		mounted: function() {
			let v = this;
			v.isMounted = true;
			v.makeLooper();

			let canFullScreen = v.$el.requestFullscreen !== undefined;
			if(!canFullScreen){
				let fullscreenPolyfill = document.createElement('script');
				fullscreenPolyfill.id = "fullscreenPolyfillScript";
				if(!document.getElementById(fullscreenPolyfill.id)){
					fullscreenPolyfill.src = 'https://unpkg.com/fullscreen-api-polyfill';
					document.body.appendChild(fullscreenPolyfill);
				}
			}
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
				v.cssHeight = canvas.clientHeight;
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
								if(v.canvasLooper){
									v.canvasLooper.sizeWindow(newWidth, newHeight);
								}
							});
						} else {
							if(v.canvasLooper){
								v.canvasLooper.sizeWindow(newWidth, newHeight);
							}
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
			v.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
			if(v.isIOS){
				v.scrollWarningWatcher = function () {
					if(v.isMounted){
						requestAnimationFrame(v.scrollWarningWatcher);
						let boundingRect = v.$el.getBoundingClientRect();
						let controlButton = v.$el.querySelector('button');
						let buttonHeight = controlButton ? controlButton.clientHeight : 0;
						let height = boundingRect.height;
						let bottom = boundingRect.bottom;
						v.isIOSWarnNeeded = bottom >= height - buttonHeight && bottom <= height + buttonHeight;
					}
				};
				requestAnimationFrame(v.scrollWarningWatcher);
			}
		},
		beforeDestroy: function () {
			let v = this;
			if(v.canvasLooper){
				v.canvasLooper.die();
			}
			document.removeEventListener('resize', v.resizeWindowEventHandler);
			document.removeEventListener('fullscreenchange', v.resizeWindowEventHandler);
			window.removeEventListener('resize', v.resizeWindowEventHandler);
			document.body.removeEventListener('focus', v.fullscreenFocusChangeHandler, true);
			if(v.isIOS){v.isMounted = false;}
		},
		methods: {
			makeLooper: function(){
				let v = this;
				if(v.isMounted && v.pathsLoaded){
					v.canvasLooper = new CanvasLooper(v.id, v.pathList, v, v.$refs.canvas);
					v.resizeWindowEventHandler();
				}
			},
			looperStatusUpdate: function(looperStatus){
				let v = this;
				for(let propertyName in looperStatus){
					if(looperStatus.hasOwnProperty(propertyName)){
						v[propertyName] = looperStatus[propertyName];
					}
				}
			},
			looperEvent: function(looperEventData){
				let v = this;
				if(this.$ga){
					looperEventData.eventCategory = 'Video';
					looperEventData.eventLabel = v.id;
					this.$ga.event(looperEventData);
				}
			},
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
				if(v.canvasLooper){
					v.canvasLooper.setPlay(v.playing);
				}
				v.looperEvent({
					eventAction: `${v.playing ? 'play' : 'pause'}-${v.isFullscreen ? 'fullscreen' : 'windowed'}`
				});
			},
			step: function (direction) {
				let v = this;
				if(!v.started){
					v.playToggle();
				}
				v.playing = false;
				if(v.loaded === 1 && v.canvasLooper){
					v.canvasLooper.setPlay(false);
					v.canvasLooper.step(direction);
				}
			},
			scrub: function (playOffset) {
				let v = this;
				if(v.loaded === 1){
					let preventOffsetWrapping = Math.max(0, playOffset - 0.000000001);
					v.playing = false;
					if(v.canvasLooper){
						v.canvasLooper.setPlay(false);
						v.canvasLooper.setTime(preventOffsetWrapping);
						v.canvasLooper.setFrameByTime();
					}
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
				v.looperEvent({
					eventAction: `fullscreen-${action}`
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
		}
	};
</script>

<style src="./perfectlooper.css"></style>
