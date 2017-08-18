<template>
	<div class="perfectlooper-control">
		<svg class="perfectlooper-control-defs" style="display: none;">
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
		<div v-if="started">
			<perfectlooper-control-bar
				:loaded="loaded"
				:scaled="scaled"
				:width="width"
				:playOffset="playOffset"
				:startIndex="startIndex"
				:currentFrameIndex="currentFrameIndex"
				:currentFrameTemplate="currentFrameTemplate"
				:lastUserAction="lastUserAction"
				:scrub="scrub"
			/>
			<perfectlooper-control-button
				label="Step 1 frame backward"
				class="step-prev"
				:disabled="loaded !== 1"
				@click.native="step(-1)">
				<g transform="translate(24, 24)">
					<g transform="rotate(180)">
						<g transform="translate(-24, -24)">
							<use xlink:href="#icon-advance"/>
						</g>
					</g>
				</g>
			</perfectlooper-control-button>
			<perfectlooper-control-button
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
			</perfectlooper-control-button>
			<perfectlooper-control-button
				label="Step 1 frame forward"
				class="step-next"
				:disabled="loaded !== 1"
				@click.native="step(1)">
				<use xlink:href="#icon-advance"/>
			</perfectlooper-control-button>
		</div>
		<perfectlooper-control-button
			label="Toggle Fullscreen"
			class="fullscreenToggle lastFocus"
			:class="{notStarted: !started}"
			@click.native="fullscreenToggle">
			<rect v-if="!started" class="fullscreenBackground" x="4" y="4" width="40" height="40" rx="4" ry="4"/>
			<use xlink:href="#icon-fullscreen"      key="off" v-if="!isFullscreen"/>
			<use xlink:href="#icon-fullscreen-exit" key="on"  v-if="isFullscreen"/>
		</perfectlooper-control-button>
	</div>
</template>

<script>
	import PerfectlooperControlBar from './perfectlooper-control-bar';
	import PerfectlooperControlButton from './perfectlooper-control-button';
	export default {
		components: {
			PerfectlooperControlBar,
			PerfectlooperControlButton
		},
		props: {
			started: Boolean,
			playing: Boolean,
			ready: Boolean,
			isFullscreen: Boolean,
			loaded: Number,
			scaled: Number,
			width: Number,
			playOffset: Number,
			startIndex: Number,
			currentFrameIndex: Number,
			currentFrameTemplate: String,
			lastUserAction: String,
			playToggle: Function,
			step: Function,
			scrub: Function,
			fullscreenToggle: Function
		}
	};
</script>
