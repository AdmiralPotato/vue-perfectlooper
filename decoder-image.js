"use strict";

let DecoderImage = function (decodedFrameBuffer) {
	let decoder = this;
	decoder.decodedFrameBuffer = decodedFrameBuffer;
	decoder.frameCount = decoder.decodedFrameBuffer.frameCount;
};

DecoderImage.prototype = {
	startLoad: function (url) {
		let decoder = this;
		decoder.src = url;
		let frameCount = decoder.decodedFrameBuffer.frameCount;
		let frame = 0;
		let imageNameList = [];
		while(frameCount > frame) {
			imageNameList.push(decoder.getImagePath(frame++));
		}
		let nextIndex = 0;
		decoder.decodedFrameBuffer.handleDecoderLoadStart();
		decoder.decodedFrameBuffer.handleDecoderDecodeStart();
		decoder.running = true;
		let getNextImage = function () {
			if(nextIndex < frameCount){
				let image = new Image();
				let frameIndex = nextIndex;
				image.addEventListener('load', function(){
					decoder.decodedFrameBuffer.handleDecoderFrame(image, frameIndex);
					nextIndex++;
					getNextImage();
				});
				image.addEventListener('error', getNextImage);
				image.src = imageNameList[nextIndex];
			}
		};
		getNextImage();
	},
	getImagePath: function(frameIndex){
		let str = (frameIndex + 1).toString();
		return this.src + '/' + ('0000'+str).substring(str.length) + '.jpg';
	}
};
