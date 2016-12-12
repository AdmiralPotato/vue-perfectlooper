let state = {
	activePage: 'videos',
	activeVideo: undefined
};

Vue.component(
	'contact',
	{
		template: `
		<div class="row">
			<div class="col-xs-12 offset-lg-2 col-lg-8">
				<div class="box"><h1>Contact</h1></div>
			</div>
		</div>
		`
	}
);

Vue.component(
	'about',
	{
		template: `
		<div class="row">
			<div class="col-xs-12 offset-lg-2 col-lg-8">
				<div class="box"><h1>About</h1></div>
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
						<div class="video">
							<videoport :video="video" />
						</div>
					</div>
					<div class="box"><h1>{{video.title}}</h1></div>
					<div class="box" v-html="video.description"></div>
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
					<span class="thumb"></span>
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
		<component :is="state.activePage" :state="state"></component>
	`
});
