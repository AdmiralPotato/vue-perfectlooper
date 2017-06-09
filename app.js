"use strict";

let state = {
	activePage: 'video-list',
	activeVideo: undefined
};

let Contact = Vue.component(
	'contact',
	{
		template: `
		<div class="contact container" v-once>
			<div class="box forText"><h1>Contact</h1></div>
		</div>
		`
	}
);

let About = Vue.component(
	'about',
	{
		template: `
		<div class="about container" v-once>
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

let VideoDetail = Vue.component(
	'video-detail',
	{
		created: function(){
			this.video = videoMap[this.$route.params.videoName];
			if(!this.video){
				console.log('Video not found.');
				router.replace('/');
				router.go('/');
			}
		},
		template: `
			<div class="video-detail" v-if="video">
				<div class="video-theatre">
					<div class="container">
						<videoport :video="video" />
					</div>
				</div>
				<div class="theatre-fade"></div>
				<div class="video-description">
					<div class="container">
						<div class="box forText"><h1>{{video.title}}</h1></div>
						<div class="box forText" v-html="video.description"></div>
					</div>
				</div>
			</div>
		`
	}
);

let VideoList = Vue.component(
	'video-list',
	{
		data: function(){
			return {
				videoList: videoList
			};
		},
		template: `
			<div class="container">
				<div class="video-list noSelect">
					<video-list-item
						v-for="video in videoList"
						:video="video"
						:key="video.name" />
				</div>
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
		template: `
			<div class="video-list-item">
				<router-link :to="'/video/' + video.name">
					<span class="box">
						<span class="thumbHolder"><span class="thumb"><img :src="thumbUrl(video)" /></span></span>
						<span class="titleHolder"><span class="title">{{video.title}}</span></span>
					</span>
				</router-link>
			</div>
		`
	}
);

let router = new VueRouter({
	mode: 'hash',
	routes: [
		{path: '/', component: VideoList},
		{path: '/video/:videoName', component: VideoDetail},
		{path: '/about/', component: About},
		{path: '/contact/', component: Contact},
	],
	scrollBehavior: function(to, from, savedPosition) {
		//works nicely, but only works when mode = 'history'
		//enable when I solve the 404 aspect in a pleasing manner
		if (savedPosition) {
			return savedPosition
		} else {
			return { x: 0, y: 0 };
		}
	}
});
router.afterEach(function(){
	//temporary until 404 fix, see above
	window.scrollTo(0, 0);
});

let app = new Vue({
	el: '#appHolder',
	router: router,
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
			<header class="container">
				<div class="brand">
					<h1><router-link to="/"><em>Video</em>.NuclearPixel.com</router-link></h1>
					<h4>v0.0.1</h4>
				</div>
				<nav>
					<ul>
						<li><router-link to="/">Videos</router-link></li>
						<li><router-link to="/about/">About</router-link></li>
						<li><router-link to="/contact/">Contact</router-link></li>
					</ul>
				</nav>
			</header>
			<div class="page-content">
				<transition
					name="fadeOutRight"
					mode="out-in"
					enter-active-class="animated fadeInRight"
					leave-active-class="animated fadeOutLeft"
					>
					<router-view />
				</transition>
			</div>
		</div>
		</div>
	`
});
