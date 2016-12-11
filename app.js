let state = {
	activePage: 'videos',
	activeVideo: undefined
};

Vue.component(
	'contact',
	{
		template: `
		<div class="row">
			<div class="box col-xs-12 col-lg-offset-2 col-lg-8"><h1>contact</h1></div>
		</div>
		`
	}
);

Vue.component(
	'about',
	{
		template: `
		<div class="row">
			<div class="box col-xs-12 col-lg-offset-2 col-lg-8"><h1>about</h1></div>
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
				<div class="box col-xs-12 col-lg-offset-2 col-lg-8 video">wat up video goes here</div>
				<div class="box col-xs-12 col-lg-offset-2 col-lg-8"><h1>{{video.title}}</h1></div>
				<div class="box col-xs-12 col-lg-offset-2 col-lg-8" v-html="video.description" />
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
			changeImage: function(){
				state.activeVideo = this.video
			}
		},
		template: `
			<div class="col-xs-6 col-sm-4 col-md-3">
				<div class="box">
					<a @click="changeImage">
						<span class="thumb"></span>
						<span class="titleHolder hidden-xs-down"><span class="title">{{video.title}}</span>
					</a>
				</div>
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
		<component :is="state.activePage" :state="state"></component>
	`
});
