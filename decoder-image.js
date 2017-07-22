"use strict";

let DecoderImage = function (decodedFrameBuffer) {
	let decoder = this;
	decoder.decodedFrameBuffer = decodedFrameBuffer;
	decoder.frameCount = decoder.decodedFrameBuffer.frameCount;
	decoder.framesLoaded = 0;
};

DecoderImage.prototype = {
	maxFailures: 10,
	startLoad: function (pathList) {
		let decoder = this;
		decoder.decodedFrameBuffer.handleDecoderLoadStart();
		pathList.forEach(function (src, frameIndex) {
			let failCount = 0;
			let getImage = function () {
				let image = new Image();
				image.addEventListener('load', function(){
					decoder.framesLoaded += 1;
					requestAnimationFrame(function () {
						decoder.decodedFrameBuffer.handleDecoderFrame(image, frameIndex);
					});
				});
				image.addEventListener('error', function(){
					if(failCount++ < decoder.maxFailures){
						setTimeout(getImage, 100);
					}
				});
				image.src = src;
			};
			getImage();
		});
	}
};

export default DecoderImage;
