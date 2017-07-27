let SequencePaths = {
	get(props, callback, posterOnlyCallback){
		let method = this.methods.failure;
		if(typeof(props.src) === 'string'){
			method = this.methods.orderedPathSequence
		} else if(props.src instanceof Array){
			method = this.methods.explicitPathSequence
		} else if(props.srcImgurAlbumId){
			method = this.methods.imgurAlbumId
		}
		method(props, callback, posterOnlyCallback);
	},
	methods: {
		failure: function (props, callback) {
			callback();
		},
		orderedPathSequence: function (props, callback) {
			let frames = parseInt(props.frames, 10);
			let startIndex =  parseInt(props.startIndex, 10);
			if(frames > 0){
				let src = props.src[props.src.length -1] !== '/' ? props.src + '/' : props.src;
				let pathList = [];
				for (let i = 0; i < frames; i++) {
					let str = (i + startIndex).toString();
					pathList.push(src + props.prefix + (props.sequenceTemplate + str).substring(str.length) + props.suffix);
				}
				callback(pathList, props.poster);
			} else {
				throw new Error(
					`vue-perfectlooper: If you specify the 'src' prop as a String, you -must- provide a greater than zero 'frames' prop.
						Inputs given; src: ${props.src} - frames: ${props.frames}`);
			}
		},
		imgurAlbumId: function (props, callback, posterOnlyCallback) {
			let imgurAlbumId = props.srcImgurAlbumId;
			let address = 'https://imgur-api-readonly.glitch.me/album/' + imgurAlbumId;
			let request = new XMLHttpRequest();
			let errorHandler = function (event) {
				console.error('Could not load: ' + address);
				console.log(event);
				callback();
			};
			request.responseType = 'json';
			request.addEventListener('load', function (loadEvent) {
				if(loadEvent.target.status >= 400){
					errorHandler(loadEvent);
				} else {
					let response = loadEvent.target.response;
					let pathList = response.data.images.map(function(image){return `https://i.imgur.com/${image.id + props.suffix}`;});
					callback(
						pathList,
						props.poster || `https://i.imgur.com/${response.data.cover}.jpg`
					);
				}
			});
			request.addEventListener('error', errorHandler);
			request.open('GET', address, true);
			request.send();
			if(props.poster){
				posterOnlyCallback(props.poster);
			}
		},
		explicitPathSequence: function (props, callback) {
			callback(props.src, props.poster);
		}
	}
};

export default SequencePaths;
