import shared from './shared';

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
		failure (props, callback) {
			callback();
		},
		orderedPathSequence (props, callback) {
			let frames = parseInt(props.frames, 10);
			let startIndex =  parseInt(props.startIndex, 10);
			if(frames > 0){
				let src = props.src[props.src.length -1] !== '/' ? props.src + '/' : props.src;
				let pathList = [];
				for (let i = 0; i < frames; i++) {
					let paddedFrame = shared.templatePad(props.sequenceTemplate, i + startIndex);
					pathList.push(src + props.prefix + paddedFrame + props.suffix);
				}
				callback(pathList, props.poster);
			} else {
				throw new Error(
					`vue-perfectlooper: If you specify the 'src' prop as a String, you -must- provide a greater than zero 'frames' prop.
						Inputs given; src: ${props.src} - frames: ${props.frames}`);
			}
		},
		imgurAlbumId (props, callback, posterOnlyCallback) {
			let imgurAlbumId = props.srcImgurAlbumId;
			let address = 'https://imgur-api-readonly.glitch.me/album/' + imgurAlbumId;
			let request = new XMLHttpRequest();
			let errorHandler = (event) => {
				console.error('Could not load: ' + address);
				console.log(event);
				callback();
			};
			request.responseType = 'json';
			request.addEventListener('load', (loadEvent) => {
				if(loadEvent.target.status >= 400){
					errorHandler(loadEvent);
				} else {
					let response = loadEvent.target.response;
					let pathList = response.data.images.map((image) => {return `https://i.imgur.com/${image.id + props.suffix}`;});
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
		explicitPathSequence (props, callback) {
			callback(props.src, props.poster);
		}
	}
};

export default SequencePaths;
