"use strict";

let state = {
	activePage: 'video-list',
	activeVideo: undefined
};

Vue.component(
	'contact',
	{
		template: `
		<div class="contact" v-once>
			<div class="box forText"><h1>Contact</h1></div>
		</div>
		`
	}
);

Vue.component(
	'about',
	{
		template: `
		<div class="about" v-once>
			<div class="box forText">
				<h1>About</h1>
				<p>Hi. My name is <a href="http://nuclearpixel.com/">Admiral Potato</a>. Welcome to my perfectly-looping Video Portfolio. I put a lot of work into making online experience looks as good as it does, so let's make it sound impressive with some buzzwords. This is a first-of-its-kind Marble Friendly Intersite Webbernet Wapp with Lazor Synthesized Virtual Shadow Dog Crumpitulation.</p>
				<p>I made this because I wanted a place to post my perfectly looping animations in a fullscreen format with a minimum of visually offensive compression artifacts - and most importantly, I wanted my animations to loop perfectly. No existing video hosting service met my standards.</p>
				<h2>License - How you may use this site and the content</h2>
				<p>The content on this site is licensed under the <a href="https://creativecommons.org/licenses/by-nc/4.0/">Creative Commons Attribution-NonCommercial 4.0 International</a>.</p>
			</div>
		</div>
		`
	}
);

Vue.component(
	'video-detail',
	{
		props: {
			state: Object
		},
		created: function(){
			this.video = this.state.activeVideo;
			if(!this.video){
				state.activePage = 'video-list';
			}
		},
		template: `
			<div class="video-detail">
				<div class="box forVideo">
					<div class="videoHolder">
						<div class="video">
							<videoport :video="video" />
						</div>
					</div>
				</div>
				<div class="box forText"><h1>{{video.title}}</h1></div>
				<div class="box forText" v-html="video.description"></div>
			</div>
		`
	}
);

Vue.component(
	'video-list',
	{
		data: function(){
			return {
				videoList: videoList
			};
		},
		template: `
			<div class="video-list noSelect">
				<video-list-item
					v-for="video in videoList"
					:video="video"
					:key="video.name" />
			</div>
		`
	}
);

Vue.component(
	'video-list-item',
	{
		mixins: [mixinAddresses],
		props: {
			video: Object
		},
		methods: {
			navigateToVideo: function(){
				state.activeVideo = this.video;
				state.activePage = 'video-detail';
				window.scrollTo(0, 0);
			}
		},
		template: `
			<div class="video-list-item">
				<a @click="navigateToVideo" tabindex="0">
					<span class="box">
						<span class="thumbHolder"><span class="thumb"><img :src="thumbUrl(video)" /></span></span>
						<span class="titleHolder"><span class="title">{{video.title}}</span></span>
					</span>
				</a>
			</div>
		`
	}
);

let app = new Vue({
	el: '#appHolder',
	data: {
		state: state
	},
	methods: {
		navigate: function(destination){
			state.activePage = destination;
			state.activeVideo = undefined;
		}
	},
	template: `
		<div class="root">
			<div class="backgroundImage"></div>
			<div class="dots"></div>
			<div class="container">
				<header>
					<div class="brand">
						<h1 tabindex="0" @click="navigate('video-list');"><em>Video</em>.NuclearPixel.com</h1>
						<h4>v0.0.1</h4>
					</div>
					<nav>
						<ul>
							<li><a tabindex="0" @click="navigate('video-list')">Videos</a></li>
							<li><a tabindex="0" @click="navigate('about')">About</a></li>
							<li><a tabindex="0" @click="navigate('contact')">Contact</a></li>
						</ul>
					</nav>
				</header>
				<transition
					name="fadeOutRight"
					mode="out-in"
					enter-active-class="animated fadeInRight"
					leave-active-class="animated fadeOutLeft"
					>
					<component :is="state.activePage" :state="state"></component>
				</transition>
			</div>
		</div>
	`
});
