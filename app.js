let state = {
	activePage: 'videos',
	activeVideo: undefined
};

Vue.component(
	'contact',
	{
		template: `
		<div class="row" v-once>
			<div class="col-xs-12 offset-lg-2 col-lg-8">
				<div class="box forText"><h1>Contact</h1></div>
			</div>
		</div>
		`
	}
);

Vue.component(
	'about',
	{
		template: `
		<div class="row" v-once>
			<div class="col-xs-12 offset-lg-2 col-lg-8">
				<div class="box forText">
					<h1>About</h1>
					<p>Hi. My name is <a href="http://nuclearpixel.com/">Admiral Potato</a>. Welcome to my perfectly-looping Video Portfolio. I put a lot of work into making online experience looks as good as it does, so let's make it sound impressive with some buzzwords. This is a first-of-its-kind Marble Friendly Intersite Webbernet Wapp with Lazor Synthesized Virtual Shadow Dog Crumpitulation.</p>
					<p>I made this because I wanted a place to post my perfectly looping animations in a fullscreen format with a minimum of visually offensive compression artifacts - and most importantly, I wanted my animations to loop perfectly. No existing video hosting service met my standards.</p>
					<h2>License - How you may use this site and the content</h2>
					<p>The content on this site is licensed under the <a href="https://creativecommons.org/licenses/by-nc/4.0/">Creative Commons Attribution-NonCommercial 4.0 International</a>.</p>
				</div>
			</div>
		</div>
		`
	}
);

Vue.component(
	'videos',
	{
		props: ['state'],
		template: `
			<div>
				<video-detail v-if="state.activeVideo" :video="state.activeVideo" />
				<list v-if="!state.activeVideo" />
			</div>
		`
	}
);

Vue.component(
	'video-detail',
	{
		props: {
			video: Object
		},
		template: `
			<div class="row">
				<div class="col-xs-12 offset-lg-1 col-lg-10">
					<div class="box">
						<div class="videoHolder">
							<div class="video">
								<videoport :video="video" />
							</div>
						</div>
					</div>
					<div class="box forText"><h1>{{video.title}}</h1></div>
					<div class="box forText" v-html="video.description"></div>
				</div>
			</div>
		`
	}
);

Vue.component(
	'list',
	{
		data: function(){
			return {
				videoList: videoList
			};
		},
		template: `
			<div class="row">
				<list-item
					v-for="video in videoList"
					:video="video" />
			</div>
		`
	}
);

Vue.component(
	'list-item',
	{
		props: {
			video: Object
		},
		methods: {
			navigateToVideo: function(){
				state.activeVideo = this.video;
				window.scrollTo(0, 0);
			}
		},
		template: `
			<div class="col-xs-6 col-sm-4 col-md-3">
				<a class="box" @click="navigateToVideo" tabindex="0">
					<span class="thumbHolder"><span class="thumb"><img :src="'http://root.nuclearpixel.com/video_portfolio_content/' + video.name.replace('-jpg','.jpg')" /></span></span>
					<span class="titleHolder hidden-xs-down"><span class="title">{{video.title}}</span>
				</a>
			</div>
		`
	}
);

let app = new Vue({
	el: '#app',
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
				<header class="row">
					<div class="col-xs-12 col-md-9">
						<h1 tabindex="0" @click="navigate('videos');"><em>Video</em>.NuclearPixel.com</h1>
						<h4>v0.0.1</h4>
					</div>
					<div class="nav col-xs-4 col-md-1"><a tabindex="0" @click="navigate('videos');">Videos</a></div>
					<div class="nav col-xs-4 col-md-1"><a tabindex="0" @click="navigate('about');">About</a></div>
					<div class="nav col-xs-4 col-md-1"><a tabindex="0" @click="navigate('contact');">Contact</a></div>
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
