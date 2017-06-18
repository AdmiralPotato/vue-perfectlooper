"use strict";

let DecoderImage = function (decodedFrameBuffer) {
	let decoder = this;
	decoder.decodedFrameBuffer = decodedFrameBuffer;
	decoder.frameCount = decoder.decodedFrameBuffer.frameCount;
	decoder.framesLoaded = 0;
};

DecoderImage.prototype = {
	startLoad: function (url) {
		let decoder = this;
		decoder.src = url;
		decoder.decodedFrameBuffer.handleDecoderLoadStart();
		for (let i = 0; i < decoder.frameCount; i++) {
			let frameIndex = i;
			let src = decoder.getImagePath(frameIndex);
			let getImage = function () {
				let image = new Image();
				image.addEventListener('load', function(e){
					if(!decoder.framesLoaded){
						decoder.decodedFrameBuffer.handleDecoderDecodeStart();
					}
					decoder.framesLoaded += 1;
					requestAnimationFrame(function () {
						decoder.decodedFrameBuffer.handleDecoderFrame(image, frameIndex);
					});
				});
				image.addEventListener('error', function(){
					setTimeout(getImage, 100);
				});
				image.src = src;
			};
			getImage();
		}
	},
	getImagePath: function(frameIndex){
		let str = (frameIndex + 1).toString();
		return this.src + '/' + ('0000'+str).substring(str.length) + '.jpg';
	}
};
