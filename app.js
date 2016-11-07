Vue.component(
    'list-item',
    {
        props: {
            title: String,
            image: String
        },
        template: `
            <div class="box col-xs-6 col-sm-4 col-md-3">
                <span class="thumb"><img :src="image" /></span>
                <span class="title">{{title}}</span>
            </div>
        `
    }
);

Vue.component(
    'list',
    {
        props: ['videoList'],
        template: `
            <div class="row">
                <list-item
                    v-for="video in videoList"
                    :title="video.title"
                    :image="video.name" />
            </div>
        `
    }
);

var app = new Vue({
    el: '#app',
    data: {
        videoList: videoList
    },
    template: `
        <list :videoList="videoList"></list>
    `
});