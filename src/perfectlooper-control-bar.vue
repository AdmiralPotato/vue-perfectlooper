<template>
	<svg :viewBox="'0 -32 ' + width + ' 80'">
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
			<g
				class="currentFrameDisplay"
				:class="{hidden: !showCurrentFrameDisplay}"
				:transform="'translate('+lineFrac(playOffset)+', -18)'">
				<g opacity="0.75">
					<rect width="40" height="24" x="-20" y="-12" rx="12" ry="12" />
					<rect width="12" height="12" transform="rotate(45)"/>
				</g>
				<text class="fill noSelect" x="0" y="1.5" font-size="16" text-anchor="middle" dominant-baseline="middle">{{currentFrameDisplay}}</text>
			</g>
		</g>
	</svg>
</template>
<script>
	import mixinTouch from './vue-mixin-touch';
	import shared from './shared';

	export default {
		mixins: [mixinTouch],
		props: {
			loaded: Number,
			scaled: Number,
			width: Number,
			playOffset: Number,
			startIndex: Number,
			currentFrameIndex: Number,
			currentFrameTemplate: String,
			lastUserAction: String,
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
			},
			showCurrentFrameDisplay: function(){
				return ['step', 'scrub'].indexOf(this.lastUserAction) !== -1;
			},
			currentFrameDisplay: function(){
				let displayFrame = this.currentFrameIndex + this.startIndex;
				return this.currentFrameTemplate ? shared.templatePad(this.currentFrameTemplate, displayFrame) : displayFrame;
			}
		},
		methods: {
			lineFrac: function (n) {
				return this.padLeft + (this.lineWidth * n);
			},
			offsetTimeByMouseEvent: function (event) {
				let controllerRect = this.$el.getBoundingClientRect();
				let offset = this.mapPointToPlayOffset(event.clientX - controllerRect.left);
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
		}
	};
</script>
