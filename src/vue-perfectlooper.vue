<template>
	<div
		class="perfectlooper"
		:class="{
			keynav: keynav,
			fullscreen: isFullscreen,
			hideCursor: playing && activityHalted,
			ios: isIOS,
			iosDangerZone: isIOSWarnNeeded
		}"
		@mousedown="disableFocusOutlines"
		@mousemove="activity"
		@touchmove="activity"
		@touchstart="touchstartHandler"
		@focus.capture="focusHandler"
		@blur.capture="blurHandler"
		@keydown.capture="enableFocusOutlines"
		@keydown.capture.left="leftHandler"
		@keydown.capture.right="rightHandler"
		@keydown.capture.space="spaceHandler"
	>
		<div
			class="aspectEnforcerContainer"
			:style="aspectEnforcerContainerStyle"
		>
			<div
				class="aspectEnforcer"
				:style="aspectEnforcerStyle"
			>
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
						<img
							key="a"
							v-if="!loaded && posterPath"
							:src="posterPath"
							@load="imageLoadAspectHandler"
						/>
						<div
							key="b"
							v-if="!ready && started"
							class="statusMessage"
						>
							<div>{{statusMessage}}</div>
						</div>
						<perfectlooper-play-icon
							key="c"
							v-if="!started"
						/>
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
					:startIndex="startIndex"
					:currentFrameIndex="currentFrameIndex"
					:currentFrameTemplate="currentFrameTemplate"
					:lastUserAction="lastUserAction"
					:playToggle="playToggle"
					:step="step"
					:scrub="scrub"
					:fullscreenToggle="fullscreenToggle"
				/>
			</div>
		</div>
	</div>
</template>

<script>
	import CanvasLooper from './canvas-looper';
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
			fps: {
				type: Number,
				default: 24
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
			currentFrameTemplate: {
				type: String,
				default: '00'
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
		data () {
			return {
				keynav: false,
				width: 0,
				height: 0,
				windowWidth: 0,
				windowHeight: 0,
				cssWidth: 0,
				cssHeight: 0,
				aspect: 9 / 16,
				pathsLoaded: false,
				currentFrameIndex: 0,
				lastUserAction: '',
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
		computed: {
			aspectEnforcerContainerStyle () {
				const aspect = this.aspect;
				const isFullscreen = this.isFullscreen;
				const windowHeight = this.windowHeight;
				return isFullscreen ? {
					maxHeight: windowHeight + 'px',
					maxWidth: Math.ceil(windowHeight / aspect) + 'px',
				} : {}
			},
			aspectEnforcerStyle () {
				return {
					paddingBottom: (this.aspect * 100) + '%'
				}
			},
		},
		created () {
			let v = this;
			SequencePaths.get(
				v,
				(pathList, poster) => {
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
				(poster) => {
					v.posterPath = poster;
				}
			);
		},
		mounted () {
			require('fullscreen-api-polyfill');
			let v = this;
			v.isMounted = true;
			v.makeLooper();
		},
		beforeMount () {
			let v = this;
			v.resizeWindowEventHandler = () => {
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
				v.windowWidth = window.innerWidth;
				v.windowHeight = window.innerHeight;
				v.isFullscreen = isFullscreen;
				if(!isCanvasInvalid && justResized){
					if(v.playing){
						v.playToggle();
						requestAnimationFrame(() => {
							v.playToggle();
						});
					}
					requestAnimationFrame(() => {
						if (v.canvasLooper) {
							console.log('resize, canvasLooper present')
							v.canvasLooper.sizeWindow(newWidth, newHeight);
						}
					});
				}
				if(
					isCanvasInvalid ||
					justResized ||
					fullscreenChanged
				){
					requestAnimationFrame(v.resizeWindowEventHandler);
				}
			};
			v.fullscreenFocusChangeHandler = (event) => {
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
			v.preFocusKeydownListener = (keydownEvent) => {
				v.enableFocusOutlines(keydownEvent);
			};
			document.addEventListener('resize', v.resizeWindowEventHandler);
			document.addEventListener('fullscreenchange', v.resizeWindowEventHandler);
			window.addEventListener('resize', v.resizeWindowEventHandler);
			document.body.addEventListener('focus', v.fullscreenFocusChangeHandler, true);
			document.body.addEventListener('keydown', v.preFocusKeydownListener, true);
			v.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
			if(v.isIOS){
				v.scrollWarningWatcher = () => {
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
		beforeDestroy () {
			let v = this;
			if(v.canvasLooper){
				v.canvasLooper.die();
			}
			document.removeEventListener('resize', v.resizeWindowEventHandler);
			document.removeEventListener('fullscreenchange', v.resizeWindowEventHandler);
			window.removeEventListener('resize', v.resizeWindowEventHandler);
			document.body.removeEventListener('focus', v.fullscreenFocusChangeHandler, true);
			document.body.removeEventListener('keydown', v.preFocusKeydownListener, true);
			if(v.isIOS){v.isMounted = false;}
		},
		methods: {
			makeLooper () {
				let v = this;
				if(v.isMounted && v.pathsLoaded){
					v.canvasLooper = new CanvasLooper(v.id, v.pathList, v, v.$refs.canvas, v.fps);
					v.resizeWindowEventHandler();
				}
			},
			looperStatusUpdate (looperStatus) {
				let v = this;
				for(let propertyName in looperStatus){
					if(looperStatus.hasOwnProperty(propertyName)){
						v[propertyName] = looperStatus[propertyName];
					}
				}
			},
			looperEvent (looperEventData) {
				let v = this;
				if(this.$ga){
					looperEventData.eventCategory = 'Video';
					looperEventData.eventLabel = v.id;
					this.$ga.event(looperEventData);
				}
			},
			disableFocusOutlines () {
				this.keynav = false;
			},
			enableFocusOutlines (event) {
				if([9, 13].indexOf(event.keyCode) !== -1){
					this.keynav = true;
				}
			},
			activity () {
				let v = this;
				v.activityHalted = false;
				if(v.activityTimeoutId){
					clearTimeout(v.activityTimeoutId);
				}
				v.activityTimeoutId = setTimeout(() => {
					v.activityHalted = true;
					v.activityTimeoutId = null;
				}, 2000);
			},
			touchstartHandler (event) {
				this.activity();
				this.disableFocusOutlines();
			},
			playToggle (event) {
				let v = this;
				v.started = true;
				v.playing = !v.playing;
				v.lastUserAction = `${v.playing ? 'play' : 'pause'}-${v.isFullscreen ? 'fullscreen' : 'windowed'}`;
				if(v.canvasLooper){
					v.canvasLooper.setPlay(v.playing);
				}
				v.looperEvent({
					eventAction: v.lastUserAction
				});
			},
			step (direction) {
				let v = this;
				if(v.loaded === 1 && v.canvasLooper){
					if(!v.started){
						v.playToggle();
					}
					v.playing = false;
					v.canvasLooper.setPlay(false);
					v.canvasLooper.step(direction);
					v.lastUserAction = 'step';
				}
			},
			scrub (playOffset) {
				let v = this;
				if(v.loaded === 1){
					let preventOffsetWrapping = Math.max(0, playOffset - 0.000000001);
					v.playing = false;
					if(v.canvasLooper){
						v.canvasLooper.setPlay(false);
						v.canvasLooper.setTime(preventOffsetWrapping);
						v.canvasLooper.setFrameByTime();
					}
					v.lastUserAction = 'scrub';
				}
			},
			fullscreenToggle () {
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
				v.lastUserAction = `fullscreen-${action}`;
				v.looperEvent({
					eventAction: v.lastUserAction
				});
			},
			imageLoadAspectHandler (event) {
				this.aspect = event.target.naturalHeight / event.target.naturalWidth
				this.$nextTick(
					this.resizeWindowEventHandler
				)
			},
			focusHandler (event) {
				event.stopPropagation();
				this.activity();
				this.focusElement = event.target;
			},
			blurHandler (event) {
				event.stopPropagation();
				this.focusElement = undefined;
			},
			leftHandler (event) {
				event.preventDefault();
				this.step(-1);
			},
			rightHandler (event) {
				event.preventDefault();
				this.step(1);
			},
			spaceHandler (event) {
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
