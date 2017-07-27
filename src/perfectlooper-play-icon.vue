<template>
	<svg class="perfectlooper-play-icon" viewBox="0 0 128 128">
		<defs>
			<filter :id="'blur-'+unique">
				<feGaussianBlur in="SourceGraphic" stdDeviation="2" />
			</filter>
			<path :id="'background-path-'+unique" d="M64,18a46,46,0,1,0,46,46A46.05239,46.05239,0,0,0,64,18ZM52.00049,90.79395A6.02286,6.02286,0,0,1,46,84.78418V43.21533a6,6,0,0,1,9-5.1958L91,58.8042a5.99981,5.99981,0,0,1,0,10.39209L55,89.98145A5.98645,5.98645,0,0,1,52.00049,90.79395Z"/>
			<clipPath :id="'background-mask-'+unique">
				<use :xlink:href="'#background-path-'+unique" />
			</clipPath>
			<clipPath :id="'stroke-mask-'+unique">
				<path d="M64,16a48,48,0,1,0,48,48A48,48,0,0,0,64,16Zm0,92a44,44,0,1,1,44-44A44.04979,44.04979,0,0,1,64,108ZM92,57.07227,56,36.2876a8,8,0,0,0-12,6.92773V84.78418a7.98345,7.98345,0,0,0,12,6.92871L91.999,70.92871A7.99955,7.99955,0,0,0,92,57.07227ZM90,67.46411,54,88.24872a4,4,0,0,1-6-3.46411V43.21539a4,4,0,0,1,6-3.46411L90,60.53589A4,4,0,0,1,90,67.46411Z"/>
			</clipPath>
		</defs>
		<g :clip-path="'url(#background-mask-'+unique+')'">
			<foreignObject width="128" height="128" :filter="'url(#blur-'+unique+')'" opacity="0.5">
				<div class="munsell-rainbow"></div>
			</foreignObject>
		</g>
		<use :xlink:href="'#background-path-'+unique" :filter="'url(#blur-'+unique+')'" stroke-width="6" stroke="rgba(0,0,0,0.5)" fill="none" />
		<g :clip-path="'url(#stroke-mask-'+unique+')'">
			<foreignObject width="128" height="128" :filter="'url(#blur-'+unique+')'">
				<div class="munsell-rainbow"></div>
			</foreignObject>
		</g>
	</svg>
</template>

<script>
	let mountCount = 0;
	export default {
		data: function(){
			return {
				//this is an odd situation that calls for unique SVG IDs for each instance of this component;
				//If one of these is changes visibility on the page while the others are showing,
				//the clip-path and blurs by the same name in all other SVGs stop working.
				//Meant when you hit play on one, all other play icons turned into just rainbow squares.
				//Solution is unique IDs for all clip-paths and blurs.
				unique: mountCount++
			};
		}
	};
</script>

<style src="./perfectlooper-play-icon.css"></style>
